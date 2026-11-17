/**
 * Picks Claude or OpenAI based on which key is in .env.local, and runs a structured call on it.
 * Server-only.
 */
import type { z } from "zod";
import { claudeParse } from "./claude";
import { openaiParse } from "./openai";
import { IdeasError, type StructuredCall } from "./prompt";

export type Provider = "anthropic" | "openai";

/** If both keys are set, Claude is used unless AI_PROVIDER=openai says otherwise. */
export function pickProvider(): Provider | null {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const preferred = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (preferred === "openai" && hasOpenAI) return "openai";
  if ((preferred === "anthropic" || preferred === "claude") && hasAnthropic) return "anthropic";
  if (hasAnthropic) return "anthropic";
  if (hasOpenAI) return "openai";
  return null;
}

export const NO_KEY_MESSAGE =
  "No API key yet. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local and restart the dev server.";

export async function structured<T extends z.ZodType>(provider: Provider, call: StructuredCall<T>): Promise<z.infer<T>> {
  return provider === "anthropic" ? claudeParse(call) : openaiParse(call);
}

/** Turn any error from a route into a JSON response the app can show. */
export function errorResponse(err: unknown) {
  if (err instanceof IdeasError) return Response.json({ error: err.message }, { status: err.status });
  console.error(err);
  return Response.json({ error: "Something went wrong. Give it another shake." }, { status: 500 });
}
