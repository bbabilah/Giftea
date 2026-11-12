export type Pronoun = "she" | "he" | "they";
export type Reaction = "loved" | "okay" | "meh";

export type OccasionKind =
  | "birthday"
  | "anniversary"
  | "mothers-day"
  | "fathers-day"
  | "valentines"
  | "christmas"
  | "graduation"
  | "wedding"
  | "new-baby"
  | "new-job"
  | "housewarming"
  | "thank-you"
  | "just-because"
  | "custom";

export interface Occasion {
  id: string;
  kind: OccasionKind;
  label: string;
  /** Repeats every year on month/day. One-offs use month/day/year. */
  recurring: boolean;
  month?: number; // 1-12
  day?: number; // 1-31
  year?: number; // one-offs only
}

export interface Gift {
  id: string;
  year: number;
  occasion: string;
  title: string;
  reaction?: Reaction;
}

export interface Idea {
  title: string;
  why: string;
  isTopPick: boolean;
}

export interface Answer {
  questionId: string;
  topic: string;
  answer: string;
  at: number;
}

export interface Friend {
  id: string;
  name: string;
  nickname?: string;
  relationship?: string;
  pronoun: Pronoun;
  color: string;
  tags: string[];
  answers: Record<string, Answer>;
  occasions: Occasion[];
  gifts: Gift[];
  shortlist: Idea[];
  lastIdeas?: { occasionId: string; ideas: Idea[] };
  createdAt: number;
}
