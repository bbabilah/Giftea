"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { BackIcon, CheckIcon, ChevronDown, GiftIcon, HeartIcon, ShakeIcon } from "@/components/icons";
import { Loading, NotFound, Shell } from "@/components/shell";
import { Button, Chip, Confetti, IconLink, cx } from "@/components/ui";
import { budgetLabel, budgetPresets, detectLocale, type Budget } from "@/lib/currency";
import { nextDate, nextOccasion, shortDate } from "@/lib/occasions";
import { fill, firstName } from "@/lib/pronouns";
import { questionById } from "@/lib/questions";
import { uid, updateFriend, useFriend } from "@/lib/store";
import type { Friend, Idea, Occasion } from "@/lib/types";

const BG = "#FFF1C9";
const QUICK_PICKS = ["Last-minute", "Experiences", "Handmade", "Ships abroad"] as const;
const JUST_BECAUSE: Occasion = { id: "just-because", kind: "just-because", label: "Just because", recurring: false };

export default function IdeasPage() {
  const { id } = useParams<{ id: string }>();
  const friend = useFriend(id);
  if (friend === undefined) return <Loading bg={BG} />;
  if (friend === null) return <NotFound />;
  return <Ideas friend={friend} />;
}

/** A pill that wraps a native <select>, so it stays accessible and simple. */
function PillSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative inline-flex h-11 flex-none items-center rounded-full border-2 border-ink bg-white text-[15px] font-bold">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full cursor-pointer appearance-none rounded-full bg-transparent pl-4 pr-9 font-bold text-ink"
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3" />
    </label>
  );
}

function Ideas({ friend }: { friend: Friend }) {
  const name = firstName(friend);
  const locale = useMemo(() => detectLocale(), []);
  const presets = useMemo(() => budgetPresets(locale.currency), [locale.currency]);

  const occasions = useMemo(() => {
    const list = [...friend.occasions].filter((o) => !(o.year && !o.recurring && !nextDate(o)));
    if (!list.some((o) => o.kind === "just-because")) list.push(JUST_BECAUSE);
    return list;
  }, [friend.occasions]);

  const [occasionId, setOccasionId] = useState(
    () => friend.lastIdeas?.occasionId ?? nextOccasion(friend)?.occasion.id ?? occasions[0].id,
  );
  const occasion = occasions.find((o) => o.id === occasionId) ?? occasions[0];

  const [budgetIdx, setBudgetIdx] = useState(1); // a sensible middle tier
  const budget: Budget | null = budgetIdx < 0 ? null : presets[budgetIdx];
  const [skipPast, setSkipPast] = useState(true);
  const [picks, setPicks] = useState<string[]>([]);

  const [ideas, setIdeas] = useState<Idea[] | null>(friend.lastIdeas?.ideas ?? null);
  const [seen, setSeen] = useState<string[]>(friend.lastIdeas?.ideas.map((i) => i.title) ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  const changeFilter = (fn: () => void) => {
    fn();
    if (ideas) setStale(true);
  };

  const shortlisted = (t: string) => friend.shortlist.some((s) => s.title === t);

  async function shake(fresh: boolean) {
    setLoading(true);
    setError(null);
    setChosen(null);
    try {
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
          skipPastGifts: skipPast,
          quickPicks: picks,
          locale: { locale: locale.locale, region: locale.region },
          avoid: fresh ? [] : seen.slice(-15),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data.ideas)) throw new Error(data.error || "Something went wrong. Give it another shake?");
      const got: Idea[] = data.ideas;
      setIdeas(got);
      setSeen((s) => [...s, ...got.map((i) => i.title)]);
      setStale(false);
      updateFriend(friend.id, (f) => ({ ...f, lastIdeas: { occasionId: occasion.id, ideas: got } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function toggleShortlist(idea: Idea) {
    updateFriend(friend.id, (f) => ({
      ...f,
      shortlist: f.shortlist.some((s) => s.title === idea.title)
        ? f.shortlist.filter((s) => s.title !== idea.title)
        : [...f.shortlist, idea],
    }));
  }

  function choose(idea: Idea) {
    const year = nextDate(occasion)?.getFullYear() ?? new Date().getFullYear();
    updateFriend(friend.id, (f) => ({
      ...f,
      gifts: [...f.gifts, { id: uid(), year, occasion: occasion.label, title: idea.title }],
      shortlist: f.shortlist.filter((s) => s.title !== idea.title),
    }));
    setChosen(idea.title);
  }

  const sorted = ideas ? [...ideas].sort((a, b) => Number(b.isTopPick) - Number(a.isTopPick)) : null;
  const pillText = `${occasion.label}${shortDate(occasion) ? ` · ${shortDate(occasion)}` : ""}`;

  return (
    <Shell bg={BG} activeId={friend.id}>
      <Confetti variant={2} className="lg:hidden" />

      {/* Mobile header */}
      <div className="relative flex items-center justify-between lg:hidden">
        <IconLink href={`/friend/${friend.id}`} label={`Back to ${name}`}>
          <BackIcon />
        </IconLink>
        <div className="max-w-[60%] truncate rounded-full border-2 border-ink bg-white px-3 py-1.5 text-[13px] font-bold">{pillText}</div>
      </div>

      <div className="relative mt-3.5 lg:mt-0">
        <Link href={`/friend/${friend.id}`} className="hidden text-[15px] font-bold lg:inline">
          ← {friend.name}
        </Link>
        <h1 className="m-0 font-display text-[32px] font-extrabold leading-[1.02] lg:mt-1.5 lg:text-[56px] lg:leading-none">
          Ta-da! {name}
          <br className="lg:hidden" /> would love…
        </h1>
      </div>

      {/* Filters */}
      <div className="no-scrollbar relative -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1.5 pt-0.5 lg:mx-0 lg:mt-6 lg:flex-wrap lg:items-center lg:gap-2.5 lg:overflow-visible lg:px-0">
        <PillSelect label="Occasion" value={occasion.id} onChange={(v) => changeFilter(() => setOccasionId(v))}>
          {occasions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </PillSelect>
        <PillSelect label="Budget" value={String(budgetIdx)} onChange={(v) => changeFilter(() => setBudgetIdx(Number(v)))}>
          {presets.map((b, i) => (
            <option key={i} value={i}>
              {budgetLabel(b, locale)}
            </option>
          ))}
          <option value={-1}>Any budget</option>
        </PillSelect>
        <button
          type="button"
          aria-pressed={skipPast}
          onClick={() => changeFilter(() => setSkipPast((s) => !s))}
          className={cx(
            "press inline-flex h-11 flex-none cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink px-4 text-[15px] font-bold text-ink",
            skipPast ? "bg-mint" : "bg-white",
          )}
        >
          Skip past gifts {skipPast && <CheckIcon size={16} />}
        </button>
        <span aria-hidden="true" className="mx-1.5 hidden h-7 w-0.5 flex-none bg-ink lg:block" />
        <span className="hidden text-sm font-bold text-ink-3 lg:inline">Quick picks:</span>
        {QUICK_PICKS.map((q) => (
          <Chip
            key={q}
            pressed={picks.includes(q)}
            onClick={() => changeFilter(() => setPicks((p) => (p.includes(q) ? p.filter((x) => x !== q) : [...p, q])))}
          >
            {q}
          </Chip>
        ))}
      </div>

      {/* Results */}
      <div className="relative mt-4 pb-28 lg:mt-6 lg:pb-0">
        {error && (
          <div role="alert" className="pop-in mb-5 rounded-[22px] border-[2.5px] border-ink bg-white p-4 shadow-hard">
            <div className="font-display text-lg font-extrabold">Oops, the gift bag got stuck.</div>
            <p className="mb-0 mt-1 text-[15px] text-ink-2">{error}</p>
          </div>
        )}

        {chosen && (
          <div role="status" className="pop-in mb-5 flex flex-wrap items-center gap-3 rounded-[22px] border-[2.5px] border-ink bg-mint p-4 shadow-hard">
            <CheckIcon />
            <span className="flex-1 font-bold">
              {chosen} it is! Added to {possessiveName(name)} gift history.
            </span>
            <Link href={`/friend/${friend.id}`} className="font-bold">
              See history →
            </Link>
          </div>
        )}

        {loading ? (
          <div aria-live="polite" className="flex flex-col items-center gap-4 py-16 text-center">
            <GiftIcon size={64} className="wiggle" />
            <div className="font-display text-2xl font-extrabold">Shaking the gift bag…</div>
            <div className="text-[15px] text-ink-2">Thinking about everything you’ve told me about {name}.</div>
          </div>
        ) : sorted ? (
          <>
            {stale && (
              <p className="mb-4 mt-0 text-[15px] font-bold text-ink-2">Filters changed. Shake again to get ideas that match.</p>
            )}
            <div className="grid items-start gap-[18px] lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] lg:gap-7">
              {sorted.map((idea, i) => (
                <IdeaCard
                  key={idea.title}
                  idea={idea}
                  tilt={[-1.5, 1, -0.5][i % 3]}
                  saved={shortlisted(idea.title)}
                  chosen={chosen === idea.title}
                  onHeart={() => toggleShortlist(idea)}
                  onChoose={() => choose(idea)}
                />
              ))}
            </div>
          </>
        ) : (
          <div
            className="pop-in mx-auto flex max-w-lg flex-col items-start gap-4 rounded-[26px] border-[2.5px] border-ink bg-white p-6 shadow-hard-lg"
            style={{ rotate: "-1deg" }}
          >
            <GiftIcon size={44} />
            <h2 className="m-0 font-display text-[26px] font-extrabold leading-tight">
              Pick the occasion and budget, then let’s see what {name} would love.
            </h2>
            {Object.keys(friend.answers).length + friend.tags.length < 3 && (
              <p className="m-0 text-[15px] text-ink-2">
                Tip: ideas get much better after you{" "}
                <Link href={`/friend/${friend.id}/tea`} className="font-bold">
                  spill a little tea
                </Link>{" "}
                about {name}.
              </p>
            )}
            <Button variant="primary" className="h-14 w-full" onClick={() => shake(true)}>
              Show me ideas!
            </Button>
          </div>
        )}

        {sorted && !loading && (
          <div className="mt-8 hidden justify-center lg:flex">
            <Button className={cx("h-14 px-7 text-base", stale && "bg-sun!")} onClick={() => shake(stale)}>
              <ShakeIcon size={18} /> Shake again for new ideas
            </Button>
          </div>
        )}
      </div>

      {/* Mobile bottom bar */}
      {sorted && !loading && (
        <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2.5 bg-gradient-to-t from-cream via-cream to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-6 lg:hidden">
          <Button className={cx("h-14 flex-1", stale && "bg-sun!")} onClick={() => shake(stale)}>
            <ShakeIcon size={18} /> Shake again
          </Button>
        </div>
      )}
    </Shell>
  );
}

function possessiveName(n: string) {
  return n.endsWith("s") ? `${n}’` : `${n}’s`;
}

function IdeaCard({
  idea,
  tilt,
  saved,
  chosen,
  onHeart,
  onChoose,
}: {
  idea: Idea;
  tilt: number;
  saved: boolean;
  chosen: boolean;
  onHeart: () => void;
  onChoose: () => void;
}) {
  const top = idea.isTopPick;
  return (
    <article
      className={cx(
        "pop-in flex flex-col gap-1.5 rounded-[22px] border-[2.5px] border-ink p-4 lg:gap-3 lg:rounded-[26px] lg:p-[26px]",
        top ? "bg-coral shadow-hard-md lg:shadow-hard-lg" : "bg-white shadow-hard lg:shadow-hard-md",
      )}
      style={{ rotate: `${tilt}deg` }}
    >
      <div className={cx("flex items-center", top ? "justify-between" : "justify-end")}>
        {top && <div className="rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-xs font-bold lg:px-3 lg:text-[13px]">Top pick</div>}
        <button
          type="button"
          aria-label={saved ? `Remove ${idea.title} from shortlist` : `Save ${idea.title} to shortlist`}
          aria-pressed={saved}
          onClick={onHeart}
          className={cx(
            "press flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink",
            saved ? (top ? "bg-sun" : "bg-coral") : "bg-white",
          )}
        >
          <HeartIcon filled={saved} />
        </button>
      </div>
      <h2 className={cx("m-0 font-display font-extrabold", top ? "text-[22px] leading-tight lg:text-[30px] lg:leading-[1.1]" : "text-[19px] leading-tight lg:text-[26px] lg:leading-[1.15]")}>
        {idea.title}
      </h2>
      <p className={cx("m-0 text-sm leading-[1.45] lg:text-base lg:leading-normal", !top && "text-ink-2")}>{idea.why}</p>
      <Button
        variant={chosen ? "mint" : top ? "secondary" : "ghost"}
        onClick={onChoose}
        disabled={chosen}
        className={cx("mt-2.5 h-12 lg:h-[54px]", top && !chosen && "font-display text-[17px] font-extrabold")}
      >
        {chosen ? (
          <>
            <CheckIcon size={18} /> Chosen!
          </>
        ) : (
          "This one!"
        )}
      </Button>
    </article>
  );
}
