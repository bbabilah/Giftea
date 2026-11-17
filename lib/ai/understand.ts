/**
 * Reads a free-typed description ("my sister Ama, 28, into pottery, hates clutter")
 * and pulls out what the chat would otherwise ask for. Server-only.
 */
import { z } from "zod";

export const UnderstandRequest = z.object({
  text: z.string().min(1).max(1000),
});

export const UnderstandSchema = z.object({
  name: z.string().nullable(),
  relationship: z.string().nullable(),
  pronoun: z.enum(["she", "he", "they"]),
  likes: z.array(z.string()),
  notes: z.array(z.string()),
  occasion: z.string().nullable(),
});

export type Understood = z.infer<typeof UnderstandSchema>;

export const UNDERSTAND_SYSTEM = `You help Giftea, a gift-ideas app, understand a short description of someone the user wants to buy a gift for.

Pull out only what the user actually said. Never invent details.
- name: the person's first name (or full name if given). Null if no name is given. If they only give a role ("my mum"), name is null.
- relationship: who they are to the user, in a few lowercase words ("sister", "best friend", "boss"). Null if not said.
- pronoun: "she" or "he" only when the words make it clear (sister, mum, wife, "she", "his"); otherwise "they".
- likes: short phrases for things they love, are into, or want (at most 8, each under 6 words, e.g. "pottery", "house plants").
- notes: other useful facts for picking a gift: dislikes, age, life events, constraints (at most 6, each under 12 words). Each note must make sense on its own, e.g. "hates clutter", "age 28" (not just "28").
- occasion: the occasion if mentioned ("birthday", "anniversary", "new job"...). Null if not said.`;
