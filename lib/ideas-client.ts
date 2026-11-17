"use client";

import type { Budget, LocaleInfo } from "./currency";
import { shortDate } from "./occasions";
import { fill } from "./pronouns";
import { questionById } from "./questions";
import type { Friend, Idea, Occasion } from "./types";

export interface IdeasOptions {
  friend: Friend;
  occasion: Occasion;
  budget: Budget | null;
  locale: LocaleInfo;
  skipPastGifts?: boolean;
  quickPicks?: string[];
  avoid?: string[];
  tweak?: string;
}

/** Calls /api/ideas with everything we know about the friend. Throws an Error with a friendly message. */
export async function fetchIdeas(o: IdeasOptions): Promise<Idea[]> {
  const { friend, occasion, budget, locale } = o;
  const res = await fetch("/api/ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      friend: {
        name: friend.name,
        pronoun: friend.pronoun,
        nickname: friend.nickname,
        relationship: friend.relationship,
        tags: friend.tags,
        tea: Object.values(friend.answers).map((a) => ({
          topic: fill(questionById(a.questionId)?.topic ?? a.topic, friend),
          answer: a.answer,
        })),
        gifts: friend.gifts.map((g) => ({ year: g.year, occasion: g.occasion, title: g.title, reaction: g.reaction })),
      },
      occasion: { label: occasion.label, date: shortDate(occasion) || undefined },
      budget: budget ? { ...budget, currency: locale.currency } : null,
      skipPastGifts: o.skipPastGifts ?? true,
      quickPicks: o.quickPicks ?? [],
      locale: { locale: locale.locale, region: locale.region },
      avoid: (o.avoid ?? []).slice(-15),
      tweak: o.tweak,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(data.ideas)) throw new Error(data.error || "Something went wrong. Give it another shake?");
  return data.ideas;
}
