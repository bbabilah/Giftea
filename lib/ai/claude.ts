import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { IdeasError, IdeasSchema, MESSAGES, SYSTEM, buildPrompt, type GeneratedIdea, type IdeasRequest } from "./prompt";

const MODEL = "claude-opus-5-5";

export async function ideasFromClaude(input: IdeasRequest): Promise<GeneratedIdea[]> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY

  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // If the main model declines, the API retries on a suitable fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // Low effort keeps ideas snappy; raise to "medium" for more considered picks.
      output_config: { effort: "low", format: betaZodOutputFormat(IdeasSchema) },
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      throw new IdeasError(MESSAGES.noIdeas, 502);
    }
    return response.parsed_output.ideas;
  } catch (err) {
    if (err instanceof IdeasError) throw err;
    if (err instanceof Anthropic.AuthenticationError) throw new IdeasError(MESSAGES.badKey("ANTHROPIC_API_KEY"), 500);
    if (err instanceof Anthropic.RateLimitError) throw new IdeasError(MESSAGES.rateLimited, 429);
    if (err instanceof Anthropic.APIConnectionError) throw new IdeasError(MESSAGES.offline, 503);
    if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error", err.status, err.message);
      throw new IdeasError(MESSAGES.hiccup, 502);
    }
    throw err;
  }
}
