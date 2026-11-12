import { ideasFromClaude } from "@/lib/ai/claude";
import { ideasFromOpenAI } from "@/lib/ai/openai";
import { IdeasError, RequestSchema, type GeneratedIdea, type IdeasRequest } from "@/lib/ai/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

type Provider = "anthropic" | "openai";

/**
 * Uses whichever key is in .env.local. If both are set, Claude is used unless
 * AI_PROVIDER=openai says otherwise.
 */
function pickProvider(): Provider | null {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const preferred = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (preferred === "openai" && hasOpenAI) return "openai";
  if ((preferred === "anthropic" || preferred === "claude") && hasAnthropic) return "anthropic";
  if (hasAnthropic) return "anthropic";
  if (hasOpenAI) return "openai";
  return null;
}

const GENERATORS: Record<Provider, (input: IdeasRequest) => Promise<GeneratedIdea[]>> = {
  anthropic: ideasFromClaude,
  openai: ideasFromOpenAI,
};

export async function POST(req: Request) {
  const provider = pickProvider();
  if (!provider) {
    return Response.json(
      {
        error:
          "No API key yet. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  let input: IdeasRequest;
  try {
    input = RequestSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "That request didn’t look right." }, { status: 400 });
  }

  try {
    let ideas = (await GENERATORS[provider](input)).slice(0, 3);
    if (ideas.length === 0) throw new IdeasError("Couldn’t come up with ideas this time. Shake again?", 502);

    // Guarantee exactly one top pick.
    const topIdx = Math.max(0, ideas.findIndex((i) => i.isTopPick));
    ideas = ideas.map((i, idx) => ({ ...i, isTopPick: idx === topIdx }));

    return Response.json({ ideas, provider });
  } catch (err) {
    if (err instanceof IdeasError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "Something went wrong. Give it another shake." }, { status: 500 });
  }
}
