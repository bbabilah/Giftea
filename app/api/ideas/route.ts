import { IdeasError, IdeasSchema, RequestSchema, SYSTEM, buildPrompt, type IdeasRequest } from "@/lib/ai/prompt";
import { NO_KEY_MESSAGE, errorResponse, pickProvider, structured } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const provider = pickProvider();
  if (!provider) return Response.json({ error: NO_KEY_MESSAGE }, { status: 500 });

  let input: IdeasRequest;
  try {
    input = RequestSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "That request didn’t look right." }, { status: 400 });
  }

  try {
    const out = await structured(provider, { schema: IdeasSchema, name: "gift_ideas", system: SYSTEM, prompt: buildPrompt(input) });
    let ideas = out.ideas.slice(0, 3);
    if (ideas.length === 0) throw new IdeasError("Couldn’t come up with ideas this time. Shake again?", 502);

    // Guarantee exactly one top pick.
    const topIdx = Math.max(0, ideas.findIndex((i) => i.isTopPick));
    ideas = ideas.map((i, idx) => ({ ...i, isTopPick: idx === topIdx }));

    return Response.json({ ideas, provider });
  } catch (err) {
    return errorResponse(err);
  }
}
