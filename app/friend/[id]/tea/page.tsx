"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BackIcon, ChatIcon, CheckIcon, ChevronDown, ChevronRight } from "@/components/icons";
import { Loading, NotFound, Shell } from "@/components/shell";
import { Button, ButtonLink, Confetti, IconLink, cx } from "@/components/ui";
import { fill, firstName, possessive } from "@/lib/pronouns";
import { QUESTIONS, pickRound, questionById } from "@/lib/questions";
import { updateFriend, useFriend } from "@/lib/store";
import type { Friend } from "@/lib/types";

const BG = "#DCE6FF";

export default function TeaPage() {
  const { id } = useParams<{ id: string }>();
  const friend = useFriend(id);
  if (friend === undefined) return <Loading bg={BG} />;
  if (friend === null) return <NotFound />;
  return <Quiz friend={friend} />;
}

function Quiz({ friend }: { friend: Friend }) {
  const name = firstName(friend);
  const [round, setRound] = useState(() => pickRound(friend.answers));
  const [index, setIndex] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [done, setDone] = useState(false);

  const q = questionById(round[index])!;
  const options = q.options.map((o) => fill(o, friend));
  const existing = friend.answers[q.id]?.answer;

  // Per-question UI state; a previous answer is preselected when re-asking.
  const initialFor = (qid: string) => {
    const nq = questionById(qid)!;
    const prev = friend.answers[qid]?.answer;
    const opts = nq.options.map((o) => fill(o, friend));
    if (prev && opts.includes(prev)) return { picked: prev, custom: "", customOpen: false };
    if (prev) return { picked: null, custom: prev, customOpen: true };
    return { picked: null, custom: "", customOpen: false };
  };
  const [picked, setPicked] = useState<string | null>(() => initialFor(round[0]).picked);
  const [custom, setCustom] = useState(() => initialFor(round[0]).custom);
  const [customOpen, setCustomOpen] = useState(() => initialFor(round[0]).customOpen);
  const [starterOpen, setStarterOpen] = useState(false);

  const loadQuestion = (i: number, ids = round) => {
    const init = initialFor(ids[i]);
    setIndex(i);
    setStarterOpen(false);
    setPicked(init.picked);
    setCustom(init.custom);
    setCustomOpen(init.customOpen);
  };

  const answer = customOpen ? custom.trim() : picked;

  const advance = () => {
    if (index + 1 >= round.length) setDone(true);
    else loadQuestion(index + 1);
  };

  const next = () => {
    if (!answer) return;
    if (answer !== existing) setNewCount((n) => n + 1);
    updateFriend(friend.id, (f) => ({
      ...f,
      answers: { ...f.answers, [q.id]: { questionId: q.id, topic: q.topic, answer, at: Date.now() } },
    }));
    advance();
  };

  const restart = () => {
    const r = pickRound(friend.answers);
    setRound(r);
    setDone(false);
    setNewCount(0);
    loadQuestion(0, r);
  };

  const teaSoFar = Object.values(friend.answers).sort((a, b) => b.at - a.at);

  const actions = (
    <>
      <Button className="h-14 min-w-[120px] flex-1 px-3" onClick={advance}>
        No idea, skip
      </Button>
      <Button variant="primary" className="h-14 min-w-[150px] flex-[1.4] px-3" onClick={next} disabled={!answer}>
        Ooh, next!
      </Button>
    </>
  );

  const starter = (
    <div>
      <button
        type="button"
        aria-expanded={starterOpen}
        onClick={() => setStarterOpen((o) => !o)}
        className="flex min-h-[48px] w-full cursor-pointer items-center gap-2.5 rounded-[14px] border-2 border-dashed border-ink-2 bg-white/55 px-3.5 py-2 text-left text-sm text-ink lg:min-h-[64px] lg:gap-3 lg:rounded-[18px] lg:px-[18px] lg:text-[15px]"
      >
        <ChatIcon className="flex-none" />
        <span className="flex-1">
          <b>Not sure<span className="hidden lg:inline"> about this one</span>?</b>{" "}
          <span className="lg:block">Get a casual way to find out<span className="hidden lg:inline"> next time you talk</span>.</span>
        </span>
        {starterOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {starterOpen && (
        <div className="pop-in mt-2 rounded-[14px] border-2 border-ink bg-white p-3.5 text-[15px] leading-relaxed lg:rounded-[18px]">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-3">Try slipping this in</div>
          {fill(q.starter, friend)}
        </div>
      )}
    </div>
  );

  if (done) {
    return (
      <Shell bg={BG} activeId={friend.id}>
        <Confetti variant={2} />
        <div className="relative mx-auto mt-6 flex max-w-xl flex-col gap-6 lg:mt-16">
          <div className="pop-in flex flex-col gap-4 rounded-[28px] border-[2.5px] border-ink bg-sun p-6 shadow-hard-xl lg:p-8" style={{ rotate: "-1deg" }}>
            <div className="text-[13px] font-bold">Round complete</div>
            <h1 className="m-0 font-display text-[34px] font-extrabold leading-[1.05] lg:text-[44px]">That’s the tea!</h1>
            <p className="m-0 text-base">
              {newCount === 0
                ? `No new tea this round, and that’s fine. Come back when you learn something new about ${name}.`
                : `You spilled ${newCount} thing${newCount === 1 ? "" : "s"} about ${name}. ${fill("{Their}", friend)} gift ideas just got a lot smarter.`}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={`/friend/${friend.id}/ideas`} variant="primary" className="h-14 flex-1">
                See gift ideas!
              </ButtonLink>
              <Button className="h-14 flex-1" onClick={restart}>
                Keep going
              </Button>
            </div>
          </div>
          <Link href={`/friend/${friend.id}`} className="self-center text-[15px] font-bold">
            ← Back to {name}
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell bg={BG} activeId={friend.id}>
      <Confetti variant={1} className="lg:hidden" />

      {/* Mobile header */}
      <div className="relative flex items-center justify-between lg:hidden">
        <IconLink href={`/friend/${friend.id}`} label={`Back to ${name}`}>
          <BackIcon />
        </IconLink>
        <div className="rounded-full border-2 border-ink bg-white px-3 py-1.5 text-[13px] font-bold">
          {index + 1} of {round.length}
        </div>
      </div>

      {/* Heading */}
      <div className="relative mt-4 flex flex-wrap items-end justify-between gap-4 lg:mt-0">
        <div>
          <Link href={`/friend/${friend.id}`} className="hidden text-[15px] font-bold lg:inline">
            ← {friend.name}
          </Link>
          <h1 className="m-0 font-display text-xl font-extrabold lg:mt-1.5 lg:text-[56px] lg:leading-none">So… what’s {name} like?</h1>
        </div>
        <div className="hidden rounded-full border-2 border-ink bg-white px-4 py-2 text-[15px] font-bold lg:block">
          {index + 1} of {round.length}
        </div>
      </div>

      <div
        className="relative mt-2.5 flex max-w-[720px] gap-[5px] lg:mt-6 lg:gap-1.5"
        role="img"
        aria-label={`${index} of ${round.length} questions answered`}
      >
        {round.map((qid, i) => (
          <div
            key={qid}
            className="h-2.5 flex-1 rounded-[5px] border-2 border-ink lg:h-3 lg:rounded-md"
            style={{ background: i < index ? "#FF5A36" : i === index ? "#FFC93C" : "#FFFFFF" }}
          />
        ))}
      </div>

      <div className="relative mt-4 grid items-start gap-4 pb-28 lg:mt-6 lg:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] lg:gap-7 lg:pb-0">
        {/* Question card */}
        <div
          key={q.id}
          className="@container pop-in flex flex-col gap-4 rounded-3xl border-[2.5px] border-ink bg-white px-[18px] py-[22px] shadow-hard-lg lg:gap-5 lg:rounded-[28px] lg:p-8 lg:shadow-hard-xl"
          style={{ rotate: "-0.75deg" }}
        >
          <h2 className="m-0 font-display text-[26px] font-extrabold leading-[1.15] lg:text-[38px] lg:leading-[1.1]">
            {fill(q.prompt, friend)}
          </h2>
          <div role="group" aria-label="Answers" className="flex flex-col gap-2.5 @md:grid @md:grid-cols-2 @md:gap-3">
            {options.map((o) => {
              const on = !customOpen && picked === o;
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setPicked(o);
                    setCustomOpen(false);
                  }}
                  className={cx(
                    "press flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-[14px] border-ink px-3.5 py-2.5 text-left text-[15px] text-ink @md:min-h-[72px] @md:rounded-2xl @md:px-4 @md:py-3.5 @md:text-base",
                    on ? "border-[2.5px] bg-mint font-bold shadow-hard-sm" : "border-2 bg-white font-medium",
                  )}
                >
                  {o}
                  {on && <CheckIcon className="flex-none" />}
                </button>
              );
            })}
            {customOpen ? (
              <form
                className="@md:col-span-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  next();
                }}
              >
                <input
                  autoFocus
                  aria-label="Your own answer"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="Tell me more…"
                  className="min-h-12 w-full rounded-[14px] border-[2.5px] border-ink bg-cream px-3.5 text-base font-bold @md:min-h-[56px] @md:rounded-2xl"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCustomOpen(true);
                  setPicked(null);
                }}
                className="min-h-12 cursor-pointer rounded-[14px] border-2 border-dashed border-ink bg-transparent px-3.5 py-2.5 text-left text-[15px] font-bold text-ink @md:col-span-2 @md:min-h-[56px] @md:rounded-2xl @md:px-4 @md:text-base"
              >
                + Something else…
              </button>
            )}
          </div>
          <div className="hidden flex-wrap gap-3 lg:flex">{actions}</div>
        </div>

        {/* Mobile: starter under the card */}
        <div className="lg:hidden">{starter}</div>

        {/* Desktop side column */}
        <div className="hidden flex-col gap-6 lg:flex">
          <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-hard-md">
            <h2 className="m-0 font-display text-[22px] font-extrabold">The tea so far</h2>
            {teaSoFar.length === 0 ? (
              <p className="mb-0 mt-3 text-[15px] text-ink-2">Nothing yet. Every answer makes {possessive(friend)} ideas better.</p>
            ) : (
              <ul className="m-0 mt-3.5 flex max-h-[420px] list-none flex-col gap-2.5 overflow-y-auto p-0 pr-1">
                {teaSoFar.map((a) => (
                  <li key={a.questionId} className="rounded-2xl border-2 border-ink bg-cream px-3.5 py-3">
                    <div className="text-[13px] text-ink-3">{fill(questionById(a.questionId)?.topic ?? a.topic, friend)}</div>
                    <div className="mt-0.5 text-[15px] font-bold">{a.answer}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {starter}
          <p className="m-0 text-sm text-ink-3">
            {Object.keys(friend.answers).length} of {QUESTIONS.length} questions answered about {name}.
          </p>
        </div>
      </div>

      {/* Mobile bottom actions */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2.5 bg-gradient-to-t from-sky via-sky to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-6 lg:hidden">
        {actions}
      </div>
    </Shell>
  );
}
