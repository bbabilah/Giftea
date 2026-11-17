import type { Friend, Occasion, OccasionKind } from "./types";

export interface OccasionPreset {
  kind: OccasionKind;
  label: string;
  recurring: boolean;
  /** Same date everywhere, so we can prefill it. */
  fixed?: { month: number; day: number };
  group: "yearly" | "one-off" | "other";
}

export const OCCASION_PRESETS: OccasionPreset[] = [
  { kind: "birthday", label: "Birthday", recurring: true, group: "yearly" },
  { kind: "anniversary", label: "Anniversary", recurring: true, group: "yearly" },
  { kind: "mothers-day", label: "Mother’s Day", recurring: true, group: "yearly" },
  { kind: "fathers-day", label: "Father’s Day", recurring: true, group: "yearly" },
  { kind: "valentines", label: "Valentine’s Day", recurring: true, fixed: { month: 2, day: 14 }, group: "yearly" },
  { kind: "christmas", label: "Christmas", recurring: true, fixed: { month: 12, day: 25 }, group: "yearly" },
  { kind: "graduation", label: "Graduation", recurring: false, group: "one-off" },
  { kind: "wedding", label: "Wedding", recurring: false, group: "one-off" },
  { kind: "new-baby", label: "New baby", recurring: false, group: "one-off" },
  { kind: "new-job", label: "New job", recurring: false, group: "one-off" },
  { kind: "housewarming", label: "Housewarming", recurring: false, group: "one-off" },
  { kind: "thank-you", label: "Thank-you", recurring: false, group: "one-off" },
  { kind: "custom", label: "Something else", recurring: false, group: "other" },
];

export function presetFor(kind: OccasionKind) {
  return OCCASION_PRESETS.find((p) => p.kind === kind)!;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function hasDate(o: Occasion) {
  return !!o.month && !!o.day;
}

/** Next time this occasion happens, today counts. Null if undated or already passed. */
export function nextDate(o: Occasion, now = new Date()): Date | null {
  if (!o.month || !o.day) return null;
  const today = startOfDay(now);
  if (o.recurring) {
    let d = new Date(today.getFullYear(), o.month - 1, o.day);
    if (d < today) d = new Date(today.getFullYear() + 1, o.month - 1, o.day);
    return d;
  }
  if (!o.year) return null;
  const d = new Date(o.year, o.month - 1, o.day);
  return d < today ? null : d;
}

export function daysBetween(from: Date, to: Date) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

export interface Upcoming {
  occasion: Occasion;
  date: Date | null;
  days: number | null;
}

/** The soonest dated occasion; falls back to one that has no date yet. */
export function nextOccasion(friend: Friend, now = new Date()): Upcoming | null {
  let best: Upcoming | null = null;
  for (const o of friend.occasions) {
    const date = nextDate(o, now);
    if (!date) continue;
    const days = daysBetween(now, date);
    if (!best || best.days === null || days < best.days) best = { occasion: o, date, days };
  }
  if (best) return best;
  const undated = friend.occasions.find((o) => !hasDate(o));
  return undated ? { occasion: undated, date: null, days: null } : null;
}

/** "in 9 days", "tomorrow", "in 6 weeks", "in March" */
export function relativeWhen(days: number, date: Date): string {
  if (days === 0) return "today!";
  if (days === 1) return "tomorrow";
  if (days <= 30) return `in ${days} days`;
  if (days <= 70) return `in ${Math.round(days / 7)} weeks`;
  return `in ${date.toLocaleDateString(undefined, { month: "long" })}`;
}

export function countdownText(days: number): string {
  if (days === 0) return "It’s today!";
  if (days === 1) return "Tomorrow!";
  return `${days} days to go!`;
}

export function shortDate(o: Occasion): string {
  if (!o.month || !o.day) return "";
  const d = new Date(o.year ?? 2000, o.month - 1, o.day);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (!o.recurring && o.year) opts.year = "numeric";
  return d.toLocaleDateString(undefined, opts);
}

export function friendSubtitle(friend: Friend, now = new Date()): string {
  const up = nextOccasion(friend, now);
  if (!up) return "No dates yet";
  if (up.days === null || !up.date) return up.occasion.label;
  return `${up.occasion.label} ${relativeWhen(up.days, up.date)}`;
}

export function sortBySoonest(friends: Friend[], now = new Date()): Friend[] {
  const key = (f: Friend) => nextOccasion(f, now)?.days ?? Number.POSITIVE_INFINITY;
  return [...friends].sort((a, b) => key(a) - key(b) || a.name.localeCompare(b.name));
}

export const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString(undefined, { month: "long" }),
);
