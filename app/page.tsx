"use client";

import Link from "next/link";
import { Loading, Shell, useAddFriend } from "@/components/shell";
import { Avatar, Button, Card, Confetti } from "@/components/ui";
import { CheckIcon, ChevronRight, GiftIcon, HeartIcon } from "@/components/icons";
import { friendSubtitle, nextOccasion, sortBySoonest } from "@/lib/occasions";
import { useFriends } from "@/lib/store";
import { Logo } from "@/components/brand";

const TILTS = [-1.5, 1, -0.5, 1.5, -1, 0.5];

export default function Home() {
  const friends = useFriends();
  const add = useAddFriend();

  if (!friends) return <Loading bg="#FFE3EA" />;
  const sorted = sortBySoonest(friends);
  const empty = sorted.length === 0;

  return (
    <Shell bg="#FFE3EA" sidebar={false}>
      <Confetti variant={0} className={empty ? "lg:hidden" : undefined} />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 lg:pt-2">
        <header className="flex min-h-[54px] items-center justify-between">
          <span>
            <Logo variant="wordmark" height={36} className="lg:hidden" />
            <Logo variant="lockup" height={68} className="-ml-1 hidden lg:block" />
          </span>
          {!empty && (
            <Button variant="primary" onClick={add.open} className="hidden h-[54px] sm:inline-flex">
              + Add a friend
            </Button>
          )}
        </header>

        {empty ? (
          <div className="grid items-center gap-10 lg:min-h-[calc(100dvh-150px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 xl:gap-20">
            <div className="flex flex-col gap-6 lg:gap-8">
              <div>
                <h1 className="m-0 font-display text-[42px] font-extrabold leading-[0.98] lg:text-[64px] lg:leading-[0.95] xl:text-[72px]">
                  Get the{" "}
                  <span className="relative inline-block whitespace-nowrap">
                    <span className="relative z-10">perfect gift.</span>
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-[0.06em] z-0 h-[0.28em] -rotate-1 rounded-full bg-sun" />
                  </span>
                </h1>
                <p className="mb-0 mt-4 max-w-md text-base leading-relaxed text-ink-2 lg:mt-5 lg:text-lg">
                  Answer a few fun questions about the people you love, and Giftea turns it into gift ideas made just
                  for them. Birthdays, anniversaries, just because: no more last-minute guessing.
                </p>
              </div>
              <Card tilt={-1.5} className="pop-in flex max-w-md flex-col items-start gap-4 bg-sun p-6 shadow-hard-lg lg:p-7">
                <GiftIcon size={44} />
                <h2 className="m-0 font-display text-[28px] font-extrabold leading-tight">Who are we spoiling first?</h2>
                <Button variant="primary" onClick={add.open} className="h-14 w-full">
                  + Add a friend
                </Button>
              </Card>
              <StepsList />
            </div>
            <HowItWorks />
          </div>
        ) : (
          <>
            <div>
              <h1 className="m-0 font-display text-[40px] font-extrabold leading-none lg:text-[56px]">Your people</h1>
              <p className="mb-0 mt-2 text-[15px] text-ink-2">Soonest first, so nothing sneaks up on you.</p>
            </div>
            <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3">
              {sorted.map((f, i) => {
                const up = nextOccasion(f);
                const soon = up?.days !== null && up?.days !== undefined && up.days <= 14;
                return (
                  <li key={f.id}>
                    <Link
                      href={`/friend/${f.id}`}
                      className="press flex items-center gap-3.5 rounded-[22px] border-[2.5px] border-ink bg-white p-4 no-underline shadow-hard lg:p-5"
                      style={{ rotate: `${TILTS[i % TILTS.length]}deg` }}
                    >
                      <Avatar name={f.name} color={f.color} size={52} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-xl font-extrabold">{f.name}</span>
                        <span
                          className="mt-1 inline-block max-w-full truncate whitespace-nowrap rounded-full border-2 border-ink px-2.5 py-0.5 align-top text-[13px] font-bold"
                          style={{ background: soon ? "#FFC93C" : "#FFF1C9" }}
                        >
                          {friendSubtitle(f)}
                        </span>
                      </span>
                      <ChevronRight />
                    </Link>
                  </li>
                );
              })}
              <li className="hidden sm:block">
                <button
                  type="button"
                  onClick={add.open}
                  className="press flex h-full min-h-[88px] w-full cursor-pointer items-center justify-center rounded-[22px] border-[2.5px] border-dashed border-ink bg-white/50 text-[15px] font-bold text-ink"
                >
                  + Add someone else
                </button>
              </li>
            </ul>
            <Button variant="ghost" onClick={add.open} className="h-14 sm:hidden">
              + Add a friend
            </Button>
          </>
        )}
      </div>
      {add.modal}
    </Shell>
  );
}

const STEPS = [
  { title: "Add your people", text: "Plus their birthdays and big days, so nothing sneaks up on you." },
  { title: "Spill the tea", text: "Quick, fun questions about what they’re into. They never see a thing." },
  { title: "Get gift ideas", text: "Three ideas that fit them, your budget and the occasion." },
];

/** The same 1-2-3 story as the desktop preview, for smaller screens. */
function StepsList() {
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0 lg:hidden" aria-label="How it works">
      {STEPS.map((s, i) => (
        <li key={s.title} className="flex items-start gap-3 rounded-2xl border-2 border-ink bg-white p-3.5">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink font-display text-base font-extrabold text-white">
            {i + 1}
          </span>
          <span>
            <span className="block font-display text-lg font-extrabold leading-tight">{s.title}</span>
            <span className="block text-sm text-ink-2">{s.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Step({ n, label, className }: { n: number; label: string; className?: string }) {
  return (
    <div className={`absolute z-10 flex items-center gap-2 ${className ?? ""}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] border-ink bg-ink font-display text-base font-extrabold text-white">
        {n}
      </span>
      <span className="rounded-full border-2 border-ink bg-white px-3 py-1 text-[13px] font-bold shadow-hard-xs">{label}</span>
    </div>
  );
}

/** Desktop-only preview of the three steps, drawn with the app's own card styles. */
function HowItWorks() {
  return (
    <section aria-label="How it works" className="relative hidden h-[600px] lg:block">
      <ol className="sr-only">
        <li>Add your people and their occasions.</li>
        <li>Spill the tea: answer fun questions about them.</li>
        <li>Get gift ideas that fit them.</li>
      </ol>

      <svg aria-hidden="true" viewBox="0 0 500 600" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <path d="M60 520 q10 -12 20 0 t20 0" stroke="#7BDCB5" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="455" y="40" width="16" height="16" rx="4" fill="#FFC93C" transform="rotate(20 463 48)" />
        <circle cx="20" cy="250" r="8" fill="#5B8CFF" />
        <circle cx="470" cy="470" r="6" fill="#FF5A36" />
        <rect x="250" y="8" width="12" height="24" rx="4" fill="#FF5A36" transform="rotate(-25 256 20)" />
        <path d="M380 540 q10 -12 20 0 t20 0" stroke="#5B8CFF" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>

      <div aria-hidden="true">
        {/* 1. Name tag */}
        <div className="absolute left-0 top-[24px] w-[min(310px,56%)]" style={{ rotate: "-4deg" }}>
          <Step n={1} label="Add your people" className="-left-3 -top-5" />
          <div className="relative flex flex-col gap-3.5 rounded-3xl border-[2.5px] border-ink bg-sun p-5 pt-7 shadow-hard-lg">
            <div className="absolute right-4 top-4 h-4 w-4 rounded-full border-[2.5px] border-ink bg-pink" />
            <div className="flex items-center gap-3">
              <Avatar name="Ama Mensah" color="#FF5A36" size={52} />
              <div>
                <div className="text-xs font-bold">To my girl</div>
                <div className="font-display text-2xl font-extrabold leading-none">Ama</div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border-[2.5px] border-ink bg-white px-3.5 py-2.5">
              <div>
                <div className="text-[11px] font-bold">Birthday · 14 Nov</div>
                <div className="font-display text-lg font-extrabold">17 days to go!</div>
              </div>
              <GiftIcon size={28} />
            </div>
          </div>
        </div>

        {/* 2. Spill the tea */}
        <div className="absolute right-0 top-[205px] w-[min(330px,60%)]" style={{ rotate: "3deg" }}>
          <Step n={2} label="Spill the tea" className="-left-4 -top-5" />
          <div className="flex flex-col gap-3 rounded-3xl border-[2.5px] border-ink bg-sky p-5 pt-7 shadow-hard-lg">
            <div className="font-display text-xl font-extrabold leading-tight">Ama’s perfect Saturday looks like…</div>
            <div className="rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm">Brunch and catching up</div>
            <div className="flex items-center justify-between rounded-xl border-[2.5px] border-ink bg-mint px-3 py-2 text-sm font-bold shadow-hard-xs">
              At home with a book and snacks <CheckIcon size={16} />
            </div>
          </div>
        </div>

        {/* 3. Top pick */}
        <div className="absolute left-[6%] top-[410px] w-[min(300px,56%)]" style={{ rotate: "-2deg" }}>
          <Step n={3} label="Get ideas" className="-left-3 -top-5" />
          <div className="flex flex-col gap-2 rounded-3xl border-[2.5px] border-ink bg-coral p-5 pt-7 shadow-hard-lg">
            <div className="flex items-center justify-between">
              <span className="rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-xs font-bold">Top pick</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-white">
                <HeartIcon size={16} />
              </span>
            </div>
            <div className="font-display text-xl font-extrabold">Pottery class for two</div>
            <div className="text-sm leading-snug">She’s been meaning to try pottery, plus it’s a day out together.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
