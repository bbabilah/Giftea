import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { IdeasError, MESSAGES, type StructuredCall } from "./prompt";

/** Override with OPENAI_MODEL in .env.local. */
const DEFAULT_MODEL = "gpt-5.5";

/** Ask OpenAI for JSON that matches `schema`. */
export async function openaiParse<T extends z.ZodType>({ schema, system, prompt, name }: StructuredCall<T>): Promise<z.infer<T>> {
  const client = new OpenAI(); // reads OPENAI_API_KEY

  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
      instructions: system,
      input: prompt,
      text: { format: zodTextFormat(schema, name) },
    });

    // Null when the model refused or the output didn't match the schema.
    if (!response.output_parsed) throw new IdeasError(MESSAGES.noIdeas, 502);
    return response.output_parsed as z.infer<T>;
  } catch (err) {
    if (err instanceof IdeasError) throw err;
    if (err instanceof OpenAI.AuthenticationError) throw new IdeasError(MESSAGES.badKey("OPENAI_API_KEY"), 500);
    if (err instanceof OpenAI.RateLimitError) throw new IdeasError(MESSAGES.rateLimited, 429);
    if (err instanceof OpenAI.APIConnectionError) throw new IdeasError(MESSAGES.offline, 503);
    if (err instanceof OpenAI.NotFoundError) {
      throw new IdeasError("That OpenAI model isn’t available to your key. Check OPENAI_MODEL in .env.local.", 500);
    }
    if (err instanceof OpenAI.APIError) {
      console.error("OpenAI API error", err.status, err.message);
      throw new IdeasError(MESSAGES.hiccup, 502);
    }
    throw err;
  }
}
