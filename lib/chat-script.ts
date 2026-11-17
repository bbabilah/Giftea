"use client";

/**
 * The guided chat, as a plain async script. The UI (components/chat.tsx) supplies `ChatIO`:
 * `say` shows a Giftea bubble, `ask` waits for a tap or typed answer, and so on.
 * Change the wording or order of questions here.
 */
import { budgetLabel, budgetPresets, type Budget, type LocaleInfo } from "./currency";
import { fetchIdeas } from "./ideas-client";
import { OCCASION_PRESETS, nextDate, shortDate, sortBySoonest } from "./occasions";
import { fill, firstName } from "./pronouns";
import { QUESTIONS, pickRound, questionById } from "./questions";
import { addFriend, uid, updateFriend } from "./store";
import type { Answer, Friend, Idea, Occasion, OccasionKind, Pronoun } from "./types";

export interface ChipOption {
  label: string;
  /** null = "no answer" (e.g. "Nope, that's it"). */
  value: string | null;
  tone?: "go" | "ghost";
}

export interface AskSpec {
  chips?: ChipOption[];
  /** Adds a "Not sure, skip" chip that answers null. */
  skip?: boolean;
  /** Whether the text box is usable for this question. */
  allowText?: boolean;
  placeholder?: string;
  /** Show the "tell me everything at once" tip under the text box. */
  hint?: boolean;
  /** Ask for a month and day instead. Answers "M-D". */
  date?: boolean;
}

export interface Reply {
  value: string | null;
  typed: boolean;
}

/** What the side panel shows while the chat fills it in. */
export interface Draft {
  friendId?: string;
  name?: string;
  color?: string;
  relationship?: string;
  occasion?: string;
  budget?: string;
  likes: string[];
  tea: { topic: string; answer: string }[];
}

export interface ChatIO {
  say(text: string, opts?: { big?: boolean }): Promise<void>;
  ask(spec: AskSpec): Promise<Reply>;
  /** Shows the typing dots while `work` runs. */
  thinking<T>(work: () => Promise<T>): Promise<T>;
  showIdeas(ideas: Idea[], friendId: string, occasionLabel: string): void;
  draft(update: Partial<Draft>): void;
  progress(step: number): void;
  restart(): void;
  openProfile(friendId: string): void;
}

export const TOTAL_STEPS = 9;

const EMOJI: Partial<Record<OccasionKind, string>> = {
  birthday: "🎂", anniversary: "💞", christmas: "🎄", valentines: "💘", "mothers-day": "💐", "fathers-day": "👔",
  graduation: "🎓", wedding: "💍", "new-baby": "🍼", "new-job": "💼", housewarming: "🏠", "thank-you": "🙏",
};
const OCCASION_CHIPS: OccasionKind[] = ["birthday", "anniversary", "christmas", "thank-you", "new-job", "housewarming", "wedding", "graduation"];

const RELATIONSHIPS = ["Best friend", "Partner", "Sister", "Brother", "Mum", "Dad", "Colleague"];

const SHE = /\b(she|her|sister|sis|mum|mom|mother|mama|wife|girlfriend|gf|aunt|auntie|grandma|gran|granny|nan|daughter|niece|cousin sister|bestie girl)\b/i;
const HE = /\b(he|him|his|brother|bro|dad|father|papa|husband|boyfriend|bf|uncle|grandpa|grandad|son|nephew)\b/i;

/** A best guess from the relationship, so we don't have to ask about pronouns. */
export function guessPronoun(relationship?: string): Pronoun {
  if (!relationship) return "they";
  if (SHE.test(relationship)) return "she";
  if (HE.test(relationship)) return "he";
  return "they";
}

function cleanName(raw: string) {
  const n = raw.trim().replace(/^(my|for|it'?s)\s+/i, "").replace(/[.!?]+$/, "").slice(0, 60);
  return n.replace(/\b\p{L}/gu, (c) => c.toUpperCase()) || "Your friend";
}

function capital(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function listOf(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function presetOccasion(kind: OccasionKind): Occasion {
  const p = OCCASION_PRESETS.find((x) => x.kind === kind)!;
  return { id: `preset-${p.kind}`, kind: p.kind, label: p.label, recurring: p.recurring, ...p.fixed };
}

/** Matches typed text like "her birthday" to a preset occasion. */
function matchOccasion(text: string): OccasionKind | null {
  const t = text.toLowerCase();
  const words: Array<[OccasionKind, RegExp]> = [
    ["birthday", /birth|bday|b-day/],
    ["anniversary", /anniversar/],
    ["christmas", /christmas|xmas/],
    ["valentines", /valentine/],
    ["mothers-day", /mother'?s day|mum'?s day|mom'?s day/],
    ["fathers-day", /father'?s day|dad'?s day/],
    ["graduation", /graduat/],
    ["wedding", /wedding|getting married/],
    ["new-baby", /baby/],
    ["new-job", /new job|promotion/],
    ["housewarming", /housewarming|new (house|home|flat|place)/],
    ["thank-you", /thank/],
  ];
  return words.find(([, re]) => re.test(t))?.[0] ?? null;
}

interface Understood {
  name: string | null;
  relationship: string | null;
  pronoun: Pronoun;
  likes: string[];
  notes: string[];
  occasion: string | null;
}

async function understand(text: string): Promise<Understood> {
  const res = await fetch("/api/understand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 1000) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.details) throw new Error(data.error || "Couldn’t read that.");
  return data.details;
}

function parseBudget(text: string): Budget | null {
  const nums = (text.replace(/,/g, "").match(/\d+(\.\d+)?/g) ?? []).map(Number);
  if (nums.length === 0) return null;
  if (nums.length === 1) return { min: 0, max: nums[0] };
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
}

const TWEAKS: Record<string, { tweak: string; cheaper?: boolean; pick?: string }> = {
  cheaper: { tweak: "cheaper than the last ideas", cheaper: true },
  personal: { tweak: "more personal and sentimental, tied closely to what I told you about them" },
  experience: { tweak: "experiences to do rather than things to own", pick: "Experiences" },
  surprise: { tweak: "something unexpected and fun they'd never think to buy themselves" },
};

export async function runChat(io: ChatIO, ctx: { friends: Friend[]; locale: LocaleInfo }) {
  const friends = sortBySoonest(ctx.friends);
  let friend: Friend | null = null;
  let newText: string | null = null;

  /* ---------- 1. Who ---------- */
  if (friends.length) {
    await io.say("Hey, welcome back! 👋");
    await io.say("Who are we shopping for?", { big: true });
    const r = await io.ask({
      chips: [
        ...friends.slice(0, 6).map((f) => ({ label: f.name, value: `friend:${f.id}` })),
        { label: "+ Someone new", value: "new" },
      ],
      allowText: true,
      placeholder: "Or type a name…",
    });
    if (r.value?.startsWith("friend:")) {
      friend = friends.find((f) => f.id === r.value!.slice(7)) ?? null;
    } else if (r.typed && r.value) {
      const typed = r.value.trim().toLowerCase();
      friend = friends.find((f) => f.name.toLowerCase() === typed || firstName(f).toLowerCase() === typed) ?? null;
      if (!friend) newText = r.value;
    }
    if (!friend && !newText) {
      await io.say("Ooh, someone new! What’s their name?");
      newText = (await io.ask({ allowText: true, hint: true, placeholder: "Their name, or tell me all about them…" })).value;
    }
  } else {
    await io.say("Hey! I’m **Giftea** 👋 Tell me who you’re shopping for and I’ll find them something they’ll actually love. Takes about a minute.");
    await io.say("Who are we spoiling?", { big: true });
    newText = (await io.ask({ allowText: true, hint: true, placeholder: "Their name, or tell me all about them…" })).value;
  }

  let name = "";
  let relationship: string | undefined;
  let pronoun: Pronoun = "they";
  const likes: string[] = [];
  const notes: string[] = [];
  let occasionHint: string | null = null;
  let oneGo = false;

  if (friend) {
    name = firstName(friend);
    relationship = friend.relationship;
    pronoun = friend.pronoun;
    io.draft({
      friendId: friend.id,
      name: friend.name,
      color: friend.color,
      relationship: friend.relationship,
      likes: friend.tags,
      tea: Object.values(friend.answers).map((a) => ({ topic: fill(questionById(a.questionId)?.topic ?? a.topic, friend!), answer: a.answer })),
    });
    io.progress(2);
    await io.say(`${name}! Great choice 💛`);
  } else {
    const text = (newText ?? "").trim();
    oneGo = text.split(/\s+/).length > 3;
    if (oneGo) {
      try {
        const d = await io.thinking(() => understand(text));
        if (d.name) name = cleanName(d.name);
        relationship = d.relationship ?? undefined;
        pronoun = d.pronoun !== "they" ? d.pronoun : guessPronoun(relationship);
        likes.push(...d.likes);
        notes.push(...d.notes);
        occasionHint = d.occasion;
      } catch {
        oneGo = false;
        await io.say("Hmm, I couldn’t quite take all that in. Let’s go step by step 🙂");
      }
      if (!name) {
        await io.say("And what’s their name?");
        name = cleanName((await io.ask({ allowText: true, placeholder: "Their name" })).value ?? "");
      }
    } else {
      name = cleanName(text);
    }
    io.draft({
      name,
      relationship: relationship ? capital(relationship) : undefined,
      likes: [...likes],
      tea: notes.map((n) => ({ topic: "Good to know", answer: capital(n) })),
    });
    io.progress(1);

    if (oneGo) {
      // Lead with a dislike if there is one: it shows we were really listening.
      const standout = notes.find((n) => /hate|not |n't|avoid|allerg|can't|dislike|no /i.test(n)) ?? "";
      const bits = [relationship ? `your ${relationship}` : "", likes.length ? `into ${listOf(likes.slice(0, 3))}` : "", standout].filter(Boolean);
      await io.say(`Ooh, that’s loads to go on. So: **${name}**${bits.length ? `, ${bits.join(", ")}` : ""}. Got it ✍️`);
      io.progress(3);
    }

    if (!relationship) {
      await io.say(`Love that. Who’s ${name} to you?`);
      const r = await io.ask({
        chips: RELATIONSHIPS.map((l) => ({ label: l, value: l.toLowerCase() })),
        skip: true,
        allowText: true,
        placeholder: "Or type it, e.g. my flatmate",
      });
      relationship = r.value?.trim().replace(/^my\s+/i, "") || undefined;
      pronoun = guessPronoun(relationship);
      io.draft({ relationship: relationship ? capital(relationship) : undefined });
      io.progress(2);
    }
  }

  const who = { name, pronoun };

  /* ---------- 2. Occasion ---------- */
  let occasion: Occasion | null = null;
  const hinted = occasionHint ? matchOccasion(occasionHint) : null;
  const theirs = (friend?.occasions ?? []).filter((o) => nextDate(o));
  if (hinted) {
    occasion = theirs.find((o) => o.kind === hinted) ?? presetOccasion(hinted);
  } else {
    await io.say("What’s the occasion?");
    const soon = theirs.slice(0, 2);
    const r = await io.ask({
      chips: [
        ...soon.map((o) => ({ label: `${EMOJI[o.kind] ?? "🎉"} ${o.label} · ${shortDate(o)}`, value: `occ:${o.id}` })),
        ...OCCASION_CHIPS.filter((k) => !soon.some((o) => o.kind === k)).map((k) => ({
          label: `${EMOJI[k]} ${OCCASION_PRESETS.find((p) => p.kind === k)!.label}`,
          value: `kind:${k}`,
        })),
        { label: "Something else", value: "other", tone: "ghost" },
      ],
      allowText: true,
      placeholder: "Or type it…",
    });
    let typed = r.typed ? r.value : null;
    if (r.value === "other") {
      await io.say("Ooh, what’s the occasion?");
      typed = (await io.ask({ allowText: true, placeholder: "e.g. passed her driving test" })).value;
    }
    if (r.value?.startsWith("occ:")) occasion = theirs.find((o) => o.id === r.value!.slice(4)) ?? null;
    else if (r.value?.startsWith("kind:")) {
      const kind = r.value.slice(5) as OccasionKind;
      occasion = theirs.find((o) => o.kind === kind) ?? presetOccasion(kind);
    } else if (typed) {
      const kind = matchOccasion(typed);
      occasion = kind
        ? (theirs.find((o) => o.kind === kind) ?? presetOccasion(kind))
        : { id: `custom-${uid()}`, kind: "custom", label: capital(typed.trim().slice(0, 80)), recurring: false };
    }
  }
  occasion ??= presetOccasion("birthday");
  io.draft({ occasion: occasion.label });
  io.progress(3);

  /* ---------- 3. Spill the tea ---------- */
  const answered = friend?.answers ?? {};
  const known = Object.keys(answered).filter((k) => questionById(k)).length;
  const count = friend ? (known >= 3 ? 1 : 3 - known) : oneGo ? 2 : 3;
  const ids = pickRound(answered, QUESTIONS.length).filter((id) => !answered[id]).slice(0, count);
  const answers: Record<string, Answer> = {};

  if (ids.length) {
    await io.say(
      friend && known > 0
        ? `I remember what you told me about ${name} ☕️ Just ${ids.length === 1 ? "one new question" : "a couple of new ones"}.`
        : `Okay, time to spill the tea on ${name} ☕️ Tap whatever fits, or skip if you’re not sure.`,
    );
    for (const [i, id] of ids.entries()) {
      const q = questionById(id)!;
      await io.say(fill(q.prompt, who), { big: true });
      const r = await io.ask({ chips: q.options.map((o) => ({ label: o, value: o })), skip: true, allowText: true, placeholder: "Or say it your way…" });
      if (r.value) {
        answers[q.id] = { questionId: q.id, topic: q.topic, answer: r.value.trim().slice(0, 300), at: Date.now() };
        io.draft({ tea: [{ topic: fill(q.topic, who), answer: r.value }] });
      }
      io.progress(4 + Math.round(((i + 1) / ids.length) * 2));
    }
  } else if (friend) {
    await io.say(`I remember what you told me about ${name} ☕️`);
  }

  if (!friend && !oneGo) {
    await io.say(`Anything else I should know about ${name}? Hobbies, a recent obsession, things ${fill("{they}", who)} can’t stand…`);
    const r = await io.ask({ chips: [{ label: "Nope, that’s it", value: null }], allowText: true, placeholder: "e.g. just got into pottery, hates clutter" });
    if (r.value) {
      notes.push(r.value.trim().slice(0, 280));
      io.draft({ tea: [{ topic: "Good to know", answer: r.value.trim() }] });
    }
  }
  io.progress(7);

  /* ---------- 4. Budget ---------- */
  const presets = budgetPresets(ctx.locale.currency);
  await io.say(friend ? "What are we spending?" : "Last one. What are we spending?");
  const br = await io.ask({
    chips: [
      ...presets.slice(0, 4).map((b, i) => ({ label: budgetLabel(b, ctx.locale), value: `b:${i}` })),
      { label: "Treat them 💸", value: "b:4" },
      { label: "Any budget", value: "any", tone: "ghost" as const },
    ],
    allowText: true,
    placeholder: "Or type an amount",
  });
  let budgetIdx = br.value?.startsWith("b:") ? Number(br.value.slice(2)) : -1;
  let budget: Budget | null = budgetIdx >= 0 ? presets[budgetIdx] : br.typed && br.value ? parseBudget(br.value) : null;
  io.draft({ budget: budgetLabel(budget, ctx.locale) });
  io.progress(8);

  /* ---------- 5. Save, then ideas ---------- */
  const noteAnswers: Record<string, Answer> = Object.fromEntries(
    notes.map((n, i) => {
      const id = `note-${uid()}`;
      return [id, { questionId: id, topic: "Good to know", answer: n, at: Date.now() + i }];
    }),
  );
  const isNew = !friend;
  if (friend) {
    const extra = { ...answers, ...noteAnswers };
    updateFriend(friend.id, (f) => ({ ...f, answers: { ...f.answers, ...extra } }));
    friend = { ...friend, answers: { ...friend.answers, ...extra } };
  } else {
    friend = addFriend({
      name,
      relationship: relationship ? capital(relationship) : undefined,
      pronoun,
      tags: Array.from(new Set(likes)),
      answers: { ...answers, ...noteAnswers },
    });
    io.draft({ friendId: friend.id, color: friend.color });
  }
  const saved = friend;

  await io.say(`Shaking the gift bag for ${name}… ✨`);
  const seen: string[] = [];
  let picks: string[] = [];
  let tweak: string | undefined;
  let round = 0;

  while (true) {
    let ideas: Idea[] | null = null;
    try {
      ideas = await io.thinking(() =>
        fetchIdeas({ friend: saved, occasion: occasion!, budget, locale: ctx.locale, quickPicks: picks, avoid: seen, tweak }),
      );
    } catch (e) {
      await io.say(`Oops, the gift bag got stuck. ${e instanceof Error ? e.message : ""}`);
      const r = await io.ask({ chips: [{ label: "Try again", value: "retry", tone: "go" }, { label: "Start over", value: "restart" }] });
      if (r.value === "restart") return io.restart();
      continue;
    }

    if (round === 0) await io.say(`Here’s what I’d get ${name}:`);
    io.showIdeas(ideas, saved.id, occasion.label);
    io.progress(9);
    seen.push(...ideas.map((i) => i.title));
    updateFriend(saved.id, (f) => ({ ...f, lastIdeas: { occasionId: occasion!.id, ideas: ideas! } }));
    round++;

    await io.say(round === 1 ? "Not quite it? Tell me how to tweak them." : "Better? Keep tweaking, or you’re all set!");
    const r = await io.ask({
      chips: [
        { label: "💸 Cheaper", value: "cheaper" },
        { label: "💌 More personal", value: "personal" },
        { label: "🎟️ An experience", value: "experience" },
        { label: "🎲 Surprise me", value: "surprise" },
        { label: "These are great ✓", value: "done", tone: "go" },
      ],
      allowText: true,
      placeholder: `Or say it, e.g. something ${fill("{they}", who)} can use every day`,
    });
    if (r.value === "done" || !r.value) break;

    const t = TWEAKS[r.value];
    tweak = t ? t.tweak : r.value.slice(0, 280);
    if (t?.pick && !picks.includes(t.pick)) picks = [...picks, t.pick];
    if (t?.cheaper) {
      if (budgetIdx > 0) budgetIdx -= 1;
      if (budgetIdx >= 0) budget = presets[budgetIdx];
      else if (budget?.max) budget = { min: 0, max: Math.round(budget.max * 0.6) };
      io.draft({ budget: budgetLabel(budget, ctx.locale) });
    }
    await io.say("On it…");
  }

  /* ---------- 6. Wrap up ---------- */
  await io.say(
    isNew
      ? `Saved ${name} to your people, with everything you told me 🎉 Tap **This one!** on a card when you’ve decided, and I’ll add it to ${fill("{their}", who)} gift history.`
      : `Updated ${name}’s profile with what you told me 🎉 Tap **This one!** on a card when you’ve decided.`,
  );

  const needsDate = occasion.recurring && !occasion.month && !(saved.occasions ?? []).some((o) => o.kind === occasion!.kind);
  if (needsDate && occasion.kind !== "custom") {
    await io.say(`Want me to keep track of ${name}’s ${occasion.label.toLowerCase()}? I’ll count down to it so it never sneaks up on you.`);
    const r = await io.ask({ chips: [{ label: "Yes, add the date", value: "yes", tone: "go" }, { label: "Not now", value: "no" }] });
    if (r.value === "yes") {
      await io.say("When is it?");
      const d = await io.ask({ date: true });
      if (d.value) {
        const [month, day] = d.value.split("-").map(Number);
        const kind = occasion.kind;
        updateFriend(saved.id, (f) => ({
          ...f,
          occasions: [...f.occasions, { id: uid(), kind, label: occasion!.label, recurring: true, month, day }],
        }));
        await io.say(`Done! You’ll see the countdown on ${name}’s profile 📅`);
      }
    }
  }

  await io.say("Anything else?");
  const last = await io.ask({
    chips: [
      { label: "🎁 Find a gift for someone else", value: "again", tone: "go" },
      { label: `👀 See ${name}’s profile`, value: "profile" },
    ],
  });
  if (last.value === "profile") io.openProfile(saved.id);
  else io.restart();
}
