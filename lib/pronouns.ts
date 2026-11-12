import type { Friend, Pronoun } from "./types";

export interface Forms {
  they: string;
  them: string;
  their: string;
  themself: string;
  /** "loves" vs "love" */
  loves: string;
  /** "has" vs "have" */
  has: string;
  /** "is" vs "are" */
  is: string;
  /** verb ending: "wears" vs "wear" */
  s: string;
}

const FORMS: Record<Pronoun, Forms> = {
  she: { they: "she", them: "her", their: "her", themself: "herself", loves: "loves", has: "has", is: "is", s: "s" },
  he: { they: "he", them: "him", their: "his", themself: "himself", loves: "loves", has: "has", is: "is", s: "s" },
  they: { they: "they", them: "them", their: "their", themself: "themself", loves: "love", has: "have", is: "are", s: "" },
};

export function forms(p: Pronoun): Forms {
  return FORMS[p] ?? FORMS.they;
}

export function firstName(friend: Pick<Friend, "name">) {
  return friend.name.trim().split(/\s+/)[0] || friend.name;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Fill {name} {they} {them} {their} {themself} {loves} {has} {is} {s} tokens. */
export function fill(template: string, friend: Pick<Friend, "name" | "pronoun">) {
  const f = forms(friend.pronoun);
  return template.replace(/\{(\w+)\}/g, (m, key: string) => {
    if (key === "name") return firstName(friend);
    if (key === "Their") return f.their[0].toUpperCase() + f.their.slice(1);
    return key in f ? f[key as keyof Forms] : m;
  });
}

/** "Ama’s" — possessive of the first name. */
export function possessive(friend: Pick<Friend, "name">) {
  const n = firstName(friend);
  return n.endsWith("s") ? `${n}’` : `${n}’s`;
}
