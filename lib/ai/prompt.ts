/**
 * Shared by every AI provider: what the browser sends, what we ask for, and the prompt.
 * Server-only (imported by app/api/ideas/route.ts).
 */
import { z } from "zod";

export const RequestSchema = z.object({
  friend: z.object({
    name: z.string().min(1).max(120),
    pronoun: z.enum(["she", "he", "they"]),
    nickname: z.string().max(120).optional(),
    relationship: z.string().max(120).optional(),
    tags: z.array(z.string().max(120)).max(60),
    tea: z.array(z.object({ topic: z.string().max(200), answer: z.string().max(300) })).max(60),
    gifts: z
      .array(
        z.object({
          year: z.number().int(),
          occasion: z.string().max(120),
          title: z.string().max(200),
          reaction: z.enum(["loved", "okay", "meh"]).optional(),
        }),
      )
      .max(100),
  }),
  occasion: z.object({ label: z.string().min(1).max(120), date: z.string().max(40).optional() }),
  budget: z
    .object({ min: z.number().min(0), max: z.number().min(0).nullable(), currency: z.string().length(3) })
    .nullable(),
  skipPastGifts: z.boolean(),
  quickPicks: z.array(z.string().max(40)).max(10),
  locale: z.object({ locale: z.string().max(35), region: z.string().max(5) }),
  avoid: z.array(z.string().max(200)).max(30),
});

export type IdeasRequest = z.infer<typeof RequestSchema>;

export const IdeasSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      isTopPick: z.boolean(),
    }),
  ),
});

export type GeneratedIdea = z.infer<typeof IdeasSchema>["ideas"][number];

/** A failure with a friendly message the app can show as-is. */
export class IdeasError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export const SYSTEM = `You are the gift-idea brain inside Giftea, a playful app that helps someone pick gifts for the people in their life.

You'll get what the user knows about one friend: things they love, answers to fun questions about them, gifts given before (with how they landed), the occasion, a budget, and any quick-pick filters. Suggest exactly 3 gift ideas.

How to pick:
- Every idea must be specific and actually buyable or bookable (e.g. "Beginner wheel-throwing pottery class for two", not "an experience").
- Ground each idea in what you were told. Build on gifts they loved; steer away from the kind of thing that got "meh".
- Fit the occasion and stay within the budget in the given currency.
- Adapt to the user's country (what's available, local customs, climate, seasons) without naming any specific shop, brand store or website.
- Exactly one idea is the top pick: the one you're most confident they'd love. The other two should feel different from it and from each other.
- If there's very little to go on, still give three good, warm ideas suited to the occasion and relationship.

Quick-pick meanings: "Last-minute" = can be bought or booked within a day or two, or delivered digitally. "Experiences" = something to do rather than own. "Handmade" = handmade by a maker or something the user could make. "Ships abroad" = the friend may live in another country, so it must be easy to send internationally or deliver digitally.

Writing style:
- title: short and concrete, at most 8 words.
- why: one or two short, warm sentences (under 30 words) saying why it fits this friend, pointing at the specific things you were told. Use the friend's first name or pronouns, and write like a friend talking, not a catalogue.`;

export function buildPrompt(input: IdeasRequest) {
  const { friend, occasion, budget, skipPastGifts, quickPicks, locale, avoid } = input;
  const pronoun = { she: "she/her", he: "he/him", they: "they/them" }[friend.pronoun];
  const lines: string[] = [];

  lines.push(`Friend: ${friend.name} (${pronoun})`);
  if (friend.relationship) lines.push(`Who they are to the user: ${friend.relationship}`);
  if (friend.nickname) lines.push(`The user calls them: ${friend.nickname}`);

  lines.push("", "Things they love:");
  lines.push(friend.tags.length ? friend.tags.map((t) => `- ${t}`).join("\n") : "- (nothing yet)");

  lines.push("", "What the user told us about them:");
  lines.push(friend.tea.length ? friend.tea.map((t) => `- ${t.topic}: ${t.answer}`).join("\n") : "- (nothing yet)");

  lines.push("", "Gifts given before:");
  if (friend.gifts.length) {
    const label = { loved: "loved it", okay: "it was okay", meh: "meh" } as const;
    for (const g of [...friend.gifts].sort((a, b) => b.year - a.year)) {
      lines.push(`- ${g.year}, ${g.occasion}: ${g.title}${g.reaction ? ` (${label[g.reaction]})` : ""}`);
    }
  } else {
    lines.push("- (none logged)");
  }

  lines.push("", `Occasion: ${occasion.label}${occasion.date ? ` (${occasion.date})` : ""}`);
  lines.push(
    `Budget: ${
      budget
        ? budget.max === null
          ? `${budget.min}+ ${budget.currency}`
          : `${budget.min}–${budget.max} ${budget.currency}`
        : "flexible"
    }`,
  );
  lines.push(`User's locale: ${locale.locale}${locale.region ? `, country code ${locale.region}` : ""}`);
  if (quickPicks.length) lines.push(`Quick picks (all must apply): ${quickPicks.join(", ")}`);
  if (skipPastGifts && friend.gifts.length) {
    lines.push("Skip past gifts: don't suggest anything already given, or a near-copy of it.");
  }
  if (avoid.length) {
    lines.push("", "Already suggested this session, so give fresh ideas instead:", ...avoid.map((a) => `- ${a}`));
  }

  return lines.join("\n");
}

export const MESSAGES = {
  noIdeas: "Couldn’t come up with ideas this time. Try a different occasion or shake again.",
  rateLimited: "Lots of gift-thinking happening right now. Try again in a moment.",
  offline: "Couldn’t reach the idea machine. Check your connection and try again.",
  hiccup: "The idea machine hiccuped. Give it another shake.",
  badKey: (envVar: string) => `Your API key didn’t work. Check ${envVar} in .env.local.`,
};
