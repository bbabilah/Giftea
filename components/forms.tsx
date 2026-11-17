"use client";

import { useState } from "react";
import { MONTHS, OCCASION_PRESETS, presetFor } from "@/lib/occasions";
import { uid } from "@/lib/store";
import type { Friend, Gift, Occasion, OccasionKind, Pronoun, Reaction } from "@/lib/types";
import { Button, Chip, Field, inputClass } from "./ui";

/* ---------- small bits ---------- */

export function MonthDay({
  month,
  day,
  onChange,
  idPrefix,
}: {
  month?: number;
  day?: number;
  onChange: (m?: number, d?: number) => void;
  idPrefix: string;
}) {
  const daysIn = month ? new Date(2024, month, 0).getDate() : 31;
  return (
    <div className="flex gap-2">
      <select
        aria-label="Month"
        id={`${idPrefix}-month`}
        className={inputClass}
        value={month ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined, day)}
      >
        <option value="">Month</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        aria-label="Day"
        className={`${inputClass} max-w-[110px]`}
        value={day ?? ""}
        onChange={(e) => onChange(month, e.target.value ? Number(e.target.value) : undefined)}
      >
        <option value="">Day</option>
        {Array.from({ length: daysIn }, (_, i) => (
          <option key={i} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>
    </div>
  );
}

const PRONOUNS: { value: Pronoun; label: string }[] = [
  { value: "she", label: "She/her" },
  { value: "he", label: "He/him" },
];

function PronounPicker({ value, onChange }: { value: Pronoun; onChange: (p: Pronoun) => void }) {
  return (
    <div role="group" aria-label="Pronouns" className="flex flex-wrap gap-2">
      {PRONOUNS.map((p) => (
        <Chip
          key={p.value}
          pressed={value === p.value}
          // Tapping the chosen one again clears it; the app then uses neutral wording.
          onClick={() => onChange(value === p.value ? "they" : p.value)}
        >
          {p.label}
        </Chip>
      ))}
    </div>
  );
}

/* ---------- friend ---------- */

export interface FriendDraft {
  name: string;
  nickname?: string;
  relationship?: string;
  pronoun: Pronoun;
  birthday?: { month: number; day: number };
}

export function FriendForm({
  initial,
  withBirthday,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<Friend>;
  withBirthday?: boolean;
  submitLabel: string;
  onSubmit: (d: FriendDraft) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [relationship, setRelationship] = useState(initial?.relationship ?? "");
  const [pronoun, setPronoun] = useState<Pronoun>(initial?.pronoun ?? "they");
  const [bm, setBm] = useState<number | undefined>();
  const [bd, setBd] = useState<number | undefined>();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          relationship: relationship.trim() || undefined,
          pronoun,
          birthday: bm && bd ? { month: bm, day: bd } : undefined,
        });
      }}
    >
      <Field label="Their name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama Mensah" required autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What you call them" hint="optional">
          <input className={inputClass} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="my girl" />
        </Field>
        <Field label="Who they are to you" hint="optional">
          <input className={inputClass} value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="best friend, sister…" />
        </Field>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">
          Pronouns <span className="font-normal text-ink-3">· optional</span>
        </span>
        <PronounPicker value={pronoun} onChange={setPronoun} />
      </div>
      {withBirthday && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">
            Birthday <span className="font-normal text-ink-3">· optional, you can add more dates later</span>
          </span>
          <MonthDay idPrefix="bday" month={bm} day={bd} onChange={(m, d) => (setBm(m), setBd(d))} />
        </div>
      )}
      <Button type="submit" variant="primary" className="mt-1 h-14" disabled={!name.trim()}>
        {submitLabel}
      </Button>
    </form>
  );
}

/* ---------- occasion ---------- */

export function OccasionForm({ initial, onSubmit }: { initial?: Occasion; onSubmit: (o: Occasion) => void }) {
  const [kind, setKind] = useState<OccasionKind>(initial?.kind ?? "birthday");
  const preset = presetFor(kind);
  const [customLabel, setCustomLabel] = useState(initial?.kind === "custom" ? initial.label : "");
  const [recurring, setRecurring] = useState(initial?.recurring ?? preset.recurring);
  const [month, setMonth] = useState<number | undefined>(initial?.month ?? preset.fixed?.month);
  const [day, setDay] = useState<number | undefined>(initial?.day ?? preset.fixed?.day);
  const [iso, setIso] = useState(() =>
    initial && !initial.recurring && initial.year && initial.month && initial.day
      ? `${initial.year}-${String(initial.month).padStart(2, "0")}-${String(initial.day).padStart(2, "0")}`
      : "",
  );

  const pick = (k: OccasionKind) => {
    const p = presetFor(k);
    setKind(k);
    setRecurring(k === "custom" ? recurring : p.recurring);
    setMonth(p.fixed?.month);
    setDay(p.fixed?.day);
    setIso("");
  };

  const groups: Array<[string, string]> = [
    ["yearly", "Every year"],
    ["one-off", "One-off"],
    ["other", "Anything else"],
  ];

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const label = kind === "custom" ? customLabel.trim() : preset.label;
        if (!label) return;
        const base: Occasion = { id: initial?.id ?? uid(), kind, label, recurring };
        if (recurring && month && day) Object.assign(base, { month, day });
        if (!recurring && iso) {
          const [y, m, d] = iso.split("-").map(Number);
          Object.assign(base, { year: y, month: m, day: d });
        }
        onSubmit(base);
      }}
    >
      {groups.map(([g, title]) => (
        <div key={g} className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-3">{title}</span>
          <div className="flex flex-wrap gap-2">
            {OCCASION_PRESETS.filter((p) => p.group === g).map((p) => (
              <Chip key={p.kind} pressed={kind === p.kind} onClick={() => pick(p.kind)}>
                {p.label}
              </Chip>
            ))}
          </div>
        </div>
      ))}

      {kind === "custom" && (
        <>
          <Field label="What’s the occasion?">
            <input className={inputClass} value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Passed their driving test" required />
          </Field>
          <div role="group" aria-label="How often" className="flex gap-2">
            <Chip pressed={!recurring} onClick={() => setRecurring(false)}>Just once</Chip>
            <Chip pressed={recurring} onClick={() => setRecurring(true)}>Every year</Chip>
          </div>
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">
          When? <span className="font-normal text-ink-3">· optional</span>
        </span>
        {recurring ? (
          <MonthDay idPrefix="occ" month={month} day={day} onChange={(m, d) => (setMonth(m), setDay(d))} />
        ) : (
          <input type="date" aria-label="Date" className={inputClass} value={iso} onChange={(e) => setIso(e.target.value)} />
        )}
        {(kind === "mothers-day" || kind === "fathers-day") && (
          <span className="text-sm text-ink-3">It moves around by country and year, so pick the date you celebrate.</span>
        )}
      </div>

      <Button type="submit" variant="primary" className="mt-1 h-14" disabled={kind === "custom" && !customLabel.trim()}>
        {initial ? "Save occasion" : "Add occasion"}
      </Button>
    </form>
  );
}

/* ---------- gift history ---------- */

export const REACTIONS: { value: Reaction; label: string; color: string }[] = [
  { value: "loved", label: "Loved it", color: "#7BDCB5" },
  { value: "okay", label: "Okay", color: "#FFC93C" },
  { value: "meh", label: "Meh", color: "#EDEAF2" },
];

export function ReactionPicker({ value, onChange }: { value?: Reaction; onChange: (r?: Reaction) => void }) {
  return (
    <div role="group" aria-label="How did they like it?" className="flex flex-wrap gap-2">
      {REACTIONS.map((r) => (
        <button
          key={r.value}
          type="button"
          aria-pressed={value === r.value}
          onClick={() => onChange(value === r.value ? undefined : r.value)}
          className="press min-h-[44px] cursor-pointer rounded-full border-2 border-ink px-4 text-sm font-bold"
          style={{ background: value === r.value ? r.color : "#fff", boxShadow: value === r.value ? "2px 2px 0 #1E1B2E" : "none" }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export function GiftForm({
  friend,
  initial,
  onSubmit,
}: {
  friend: Friend;
  initial?: Gift;
  onSubmit: (g: Gift) => void;
}) {
  const thisYear = new Date().getFullYear();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [occasion, setOccasion] = useState(initial?.occasion ?? friend.occasions[0]?.label ?? "Birthday");
  const [year, setYear] = useState(initial?.year ?? thisYear);
  const [reaction, setReaction] = useState<Reaction | undefined>(initial?.reaction);
  const labels = Array.from(new Set([...friend.occasions.map((o) => o.label), ...OCCASION_PRESETS.filter((p) => p.kind !== "custom").map((p) => p.label)]));

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({ id: initial?.id ?? uid(), title: title.trim(), occasion: occasion.trim() || "Gift", year, reaction });
      }}
    >
      <Field label="What did you give?">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scented candles" required autoFocus />
      </Field>
      <div className="grid grid-cols-[1fr_120px] gap-3">
        <Field label="Occasion">
          <input className={inputClass} list="occasion-labels" value={occasion} onChange={(e) => setOccasion(e.target.value)} />
          <datalist id="occasion-labels">
            {labels.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </Field>
        <Field label="Year">
          <select className={inputClass} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 15 }, (_, i) => thisYear + 1 - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">
          How did it go? <span className="font-normal text-ink-3">· optional</span>
        </span>
        <ReactionPicker value={reaction} onChange={setReaction} />
      </div>
      <Button type="submit" variant="primary" className="mt-1 h-14" disabled={!title.trim()}>
        {initial ? "Save gift" : "Add to gift history"}
      </Button>
    </form>
  );
}
