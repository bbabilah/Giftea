import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { IdeasError, MESSAGES, type StructuredCall } from "./prompt";

const MODEL = "claude-opus-5-5";

/** Ask Claude for JSON that matches `schema`. */
export async function claudeParse<T extends z.ZodType>({ schema, system, prompt }: StructuredCall<T>): Promise<z.infer<T>> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY

  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // If the main model declines, the API retries on a suitable fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // Low effort keeps replies snappy; raise to "medium" for more considered picks.
      output_config: { effort: "low", format: betaZodOutputFormat(schema) },
      system,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      throw new IdeasError(MESSAGES.noIdeas, 502);
    }
    return response.parsed_output as z.infer<T>;
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
