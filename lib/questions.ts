/**
 * Questions the app asks *you* about your friend. Templates use tokens from
 * lib/pronouns.ts: {name} {they} {them} {their} {Their} {themself} {loves} {has} {is}.
 */
export interface Question {
  id: string;
  /** Short label for "The tea so far", e.g. "{Their} vibe lately". */
  topic: string;
  prompt: string;
  options: string[];
  /** A casual way to find out, without making it obvious. */
  starter: string;
}

export const QUESTIONS: Question[] = [
  {
    id: "vibe",
    topic: "{Their} vibe lately",
    prompt: "{name}’s vibe lately is…",
    options: ["Cosy homebody era", "Busy, busy, busy", "Self-care and glow-up mode", "Out and about every weekend"],
    starter: "“What’s been the best bit of your week? I feel like we haven’t properly caught up.”",
  },
  {
    id: "saturday",
    topic: "Perfect Saturday",
    prompt: "{name}’s perfect Saturday looks like…",
    options: ["Brunch and catching up with friends", "At home with a book and snacks", "Out exploring somewhere new", "Sport, gym or a long walk"],
    starter: "“Okay, dream Saturday, no responsibilities. What are you doing?”",
  },
  {
    id: "things-vs-experiences",
    topic: "Things or experiences?",
    prompt: "Would {name} rather get…",
    options: ["Something to keep", "An experience to remember", "Something useful, honestly", "Food. Always food."],
    starter: "“What’s the best present you’ve ever got? Was it a thing or more of a day out?”",
  },
  {
    id: "meaning-to-try",
    topic: "Something {they} {has} been meaning to try",
    prompt: "Something {name} {has} been meaning to try…",
    options: ["A craft class, like pottery", "A new restaurant or cuisine", "A sport or dance class", "A weekend getaway"],
    starter: "“Is there anything you keep saying you’ll try one day but never get round to?”",
  },
  {
    id: "comfort",
    topic: "Comfort food or drink",
    prompt: "{name}’s ultimate comfort food or drink is…",
    options: ["Something sweet", "A really good tea or coffee", "Anything spicy", "Home cooking, the classics"],
    starter: "“Bad day, you can have anything to eat or drink. What is it?”",
  },
  {
    id: "free-time",
    topic: "Free time",
    prompt: "When {name} {has} free time, you’ll find {them}…",
    options: ["Watching a series or reading", "Cooking or baking", "Making music or art", "Gaming"],
    starter: "“What have you been doing to switch off lately?”",
  },
  {
    id: "never-buy",
    topic: "Would never buy {themself}",
    prompt: "Something {name} would never buy {themself}…",
    options: ["Fancy skincare or fragrance", "Really nice bedding or loungewear", "A gadget or tech toy", "A treat-yourself spa day"],
    starter: "“What’s something you’d love but could never justify spending on?”",
  },
  {
    id: "style",
    topic: "{Their} style",
    prompt: "{name}’s style is…",
    options: ["Classic and neat", "Bold and colourful", "Comfy first, always", "Always on trend"],
    starter: "“Where did you get that? I love it.” (Then just listen.)",
  },
  {
    id: "home",
    topic: "{Their} space at home",
    prompt: "{name}’s space at home is…",
    options: ["Full of plants", "Minimal, no clutter", "Cosy, candles everywhere", "A work in progress"],
    starter: "“Have you done anything new to your place lately?”",
  },
  {
    id: "soundtrack",
    topic: "Soundtrack to {their} life",
    prompt: "The soundtrack to {name}’s life is…",
    options: ["Whatever’s trending", "Old-school classics", "Podcasts over music", "Live gigs and concerts"],
    starter: "“What have you had on repeat lately? I need new stuff.”",
  },
  {
    id: "feels-loved",
    topic: "Feels most loved with",
    prompt: "{name} feels most loved with…",
    options: ["Thoughtful words", "Quality time together", "A surprise gift", "Help with something"],
    starter: "“What’s the nicest thing someone’s done for you recently?”",
  },
  {
    id: "dream-trip",
    topic: "Dream trip",
    prompt: "A dream trip for {name} is…",
    options: ["Beach and doing nothing", "A city break full of food", "Mountains and hiking", "Going home to see family"],
    starter: "“If you could disappear for a week, where would you go?”",
  },
  {
    id: "obsession",
    topic: "Current obsession",
    prompt: "{name}’s current obsession is…",
    options: ["A TV series", "A sport or team", "A new hobby", "{Their} pet"],
    starter: "“What are you into at the moment? You always know the good stuff.”",
  },
  {
    id: "unwind",
    topic: "How {they} unwind{s}",
    prompt: "To unwind, {name}…",
    options: ["Takes a long bath or shower", "Goes for a walk", "Calls a friend", "Scrolls, honestly"],
    starter: "“How do you actually relax? I’m trying to get better at it.”",
  },
  {
    id: "surprises",
    topic: "Surprises?",
    prompt: "How does {name} feel about surprises?",
    options: ["Loves a big surprise", "Prefers to know what’s coming", "Small surprises only", "Hates any fuss"],
    starter: "“Would you rather get a surprise or pick your own present?”",
  },
  {
    id: "practical-sentimental",
    topic: "Practical or sentimental?",
    prompt: "The best gift for {name} is…",
    options: ["Practical, used every day", "Sentimental, a bit emotional", "A bit of both", "Funny beats both"],
    starter: "“Do you keep cards and little keepsakes, or are you a declutter person?”",
  },
  {
    id: "kitchen",
    topic: "In the kitchen",
    prompt: "In the kitchen, {name} is…",
    options: ["A proper chef", "Strictly microwave", "The baker of the group", "Mostly there for snacks"],
    starter: "“Cooked anything good lately?”",
  },
  {
    id: "complaining",
    topic: "Lately complaining about",
    prompt: "Lately, {name} keeps complaining about…",
    options: ["Something old or broken", "Never having time for {themself}", "Being tired all the time", "Missing friends or family"],
    starter: "“How are you really doing? Anything driving you mad lately?”",
  },
  {
    id: "colours",
    topic: "Favourite colours",
    prompt: "{name}’s colours are…",
    options: ["Earthy and neutral", "Bright and loud", "Black, always", "Soft pastels"],
    starter: "Look at what {they} wear{s} and {their} phone case. Colours rarely lie.",
  },
  {
    id: "morning",
    topic: "Morning or night?",
    prompt: "{name} is…",
    options: ["An early bird", "A night owl", "No words before coffee", "Depends on the day"],
    starter: "“Are you a morning person? Be honest.”",
  },
];

export function questionById(id: string) {
  return QUESTIONS.find((q) => q.id === id);
}

/** Pick a round of questions: unanswered first, then the oldest answers again. */
export function pickRound(answered: Record<string, { at: number }>, size = 8): string[] {
  const fresh = QUESTIONS.filter((q) => !answered[q.id]).map((q) => q.id);
  const old = QUESTIONS.filter((q) => answered[q.id])
    .sort((a, b) => answered[a.id].at - answered[b.id].at)
    .map((q) => q.id);
  return [...fresh, ...old].slice(0, size);
}
