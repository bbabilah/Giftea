"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { TOTAL_STEPS, runChat, type AskSpec, type ChatIO, type Draft, type Reply } from "@/lib/chat-script";
import { detectLocale } from "@/lib/currency";
import { firstName, possessive } from "@/lib/pronouns";
import { uid, updateFriend, useFriend } from "@/lib/store";
import type { Friend, Idea } from "@/lib/types";
import { Logo } from "./brand";
import { MonthDay } from "./forms";
import { CheckIcon, HeartIcon, ShakeIcon } from "./icons";
import { LayoutSwitch } from "./layout-switch";
import { Avatar, cx } from "./ui";

type Msg =
  | { id: string; from: "bot"; text: string; big?: boolean }
  | { id: string; from: "me"; text: string }
  | { id: string; from: "ideas"; ideas: Idea[]; friendId: string; occasion: string };

const CANCELLED = Symbol("cancelled");
const EXAMPLE = "My sister Ama, she’s 28, into pottery and house plants, hates clutter";

/** Renders **bold** in bot messages. */
function rich(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i} className="font-display font-extrabold">{part}</b> : <Fragment key={i}>{part}</Fragment>));
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function ChatHome({ friends }: { friends: Friend[] }) {
  const router = useRouter();
  const locale = useMemo(() => detectLocale(), []);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [spec, setSpec] = useState<AskSpec | null>(null);
  const [draft, setDraft] = useState<Draft>({ likes: [], tea: [] });
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [runId, setRunId] = useState(0);

  const token = useRef(0);
  const resolver = useRef<((r: Reply) => void) | null>(null);
  // The chat reads the friends list once at the start of each run.
  const latestFriends = useRef(friends);
  useEffect(() => {
    latestFriends.current = friends;
  }, [friends]);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Run the script. Restarting (or React's dev double-mount) bumps the token, which cancels the old run.
  useEffect(() => {
    const mine = ++token.current;
    const alive = () => {
      if (token.current !== mine) throw CANCELLED;
    };
    setMessages([]);
    setDraft({ likes: [], tea: [] });
    setStep(0);
    setSpec(null);
    setText("");

    const io: ChatIO = {
      async say(t, opts) {
        alive();
        setTyping(true);
        await wait(Math.min(900, 380 + t.length * 6));
        alive();
        setTyping(false);
        setMessages((m) => [...m, { id: uid(), from: "bot", text: t, big: opts?.big }]);
        await wait(90);
        alive();
      },
      async ask(s) {
        alive();
        setSpec(s);
        const reply = await new Promise<Reply>((resolve) => (resolver.current = resolve));
        alive();
        return reply;
      },
      async thinking(work) {
        alive();
        setTyping(true);
        try {
          return await work();
        } finally {
          if (token.current === mine) setTyping(false);
          alive();
        }
      },
      showIdeas(ideas, friendId, occasion) {
        alive();
        setMessages((m) => [...m, { id: uid(), from: "ideas", ideas, friendId, occasion }]);
      },
      draft(update) {
        alive();
        setDraft((d) => ({ ...d, ...update, tea: update.tea ? [...d.tea, ...update.tea] : d.tea }));
      },
      progress(n) {
        alive();
        setStep(n);
      },
      restart() {
        setRunId((r) => r + 1);
      },
      openProfile(id) {
        router.push(`/friend/${id}`);
      },
    };

    runChat(io, { friends: latestFriends.current, locale }).catch((e) => {
      if (e !== CANCELLED) console.error(e);
    });
    return () => {
      token.current++;
      resolver.current = null;
    };
  }, [runId, locale, router]);

  const restart = () => setRunId((r) => r + 1);

  const answer = (value: string | null, shown: string, typed = false) => {
    const resolve = resolver.current;
    if (!resolve) return;
    resolver.current = null;
    setSpec(null);
    setText("");
    setMessages((m) => [...m, { id: uid(), from: "me", text: shown }]);
    resolve({ value, typed });
  };

  // Keep the newest message in view.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, spec]);

  // Focus the text box when typing is the main way to answer (not over chips, so phones don't pop the keyboard).
  useEffect(() => {
    if (spec?.allowText && !spec.chips?.length) inputRef.current?.focus({ preventScroll: true });
  }, [spec]);

  const canType = !!spec?.allowText;
  let lastFrom: Msg["from"] | null = null;

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)] bg-pink lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex min-h-0 min-w-0 flex-col">
        <header className="flex items-center gap-2 border-b-[2.5px] border-ink px-4 py-3 sm:gap-3 lg:px-6">
          <Link href="/" aria-label="Giftea, start over" onClick={restart} className="flex flex-none">
            <Logo variant="wordmark" height={32} className="lg:hidden" />
            <Logo variant="wordmark" height={40} className="hidden lg:block" />
          </Link>
          <div className="mx-auto hidden h-3.5 max-w-[260px] flex-1 overflow-hidden rounded-full border-2 border-ink bg-white sm:block" aria-hidden="true">
            <div className="h-full bg-mint transition-[width] duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
          <LayoutSwitch value="chat" className="ml-auto sm:ml-0" />
          <button
            type="button"
            onClick={restart}
            aria-label="Start over"
            title="Start over"
            className="press flex h-11 flex-none cursor-pointer items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-white px-3 text-sm font-bold shadow-hard-xs"
          >
            <ShakeIcon size={16} />
            <span className="hidden md:inline">Start over</span>
          </button>
        </header>
        <div className="h-1.5 bg-white sm:hidden" aria-hidden="true">
          <div className="h-full bg-mint transition-[width] duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>

        <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-6 lg:px-6" aria-live="polite">
          <div className="@container mx-auto flex max-w-[720px] flex-col gap-2.5">
            {messages.map((m) => {
              const cont = lastFrom === "bot" && m.from === "bot";
              lastFrom = m.from;
              if (m.from === "me") return <MeBubble key={m.id} text={m.text} />;
              if (m.from === "ideas") return <ChatIdeas key={m.id} ideas={m.ideas} friendId={m.friendId} occasion={m.occasion} />;
              return (
                <BotRow key={m.id} hideFace={cont}>
                  <div className={cx("bubble-bot", m.big && "font-display text-[22px] font-extrabold leading-tight")}>{rich(m.text)}</div>
                </BotRow>
              );
            })}
            {typing && (
              <BotRow hideFace={lastFrom === "bot"}>
                <div className="bubble-bot flex gap-1.5 py-4" aria-label="Giftea is typing">
                  <i className="typing-dot" />
                  <i className="typing-dot [animation-delay:150ms]" />
                  <i className="typing-dot [animation-delay:300ms]" />
                </div>
              </BotRow>
            )}

            {spec && !typing && (spec.chips?.length || spec.skip) ? (
              <div className="pop-in flex flex-wrap gap-2 pl-12">
                {spec.chips?.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => answer(c.value, c.label)}
                    className={cx(
                      "press min-h-11 cursor-pointer rounded-full border-2 border-ink px-4 text-[15px] font-bold",
                      c.tone === "go" ? "bg-coral text-ink shadow-hard-xs" : c.tone === "ghost" ? "border-dashed bg-transparent text-ink-2" : "bg-white shadow-hard-xs hover:bg-cream",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
                {spec.skip && (
                  <button
                    type="button"
                    onClick={() => answer(null, "Not sure, skip")}
                    className="press min-h-11 cursor-pointer rounded-full border-2 border-dashed border-ink bg-transparent px-4 text-[15px] font-bold text-ink-2"
                  >
                    Not sure, skip
                  </button>
                )}
              </div>
            ) : null}

            {spec?.date && !typing && <DatePick onDone={(md, shown) => answer(md, shown)} />}
          </div>
        </div>

        <div className="border-t-[2.5px] border-ink bg-pink px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 lg:px-6">
          <form
            className="mx-auto flex max-w-[720px] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = text.trim();
              if (v && canType) answer(v, v, true);
            }}
          >
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!canType}
              placeholder={canType ? (spec?.placeholder ?? "Type here…") : spec ? "Tap an answer above" : "…"}
              aria-label="Your answer"
              maxLength={1000}
              className="h-[52px] min-w-0 flex-1 rounded-2xl border-[2.5px] border-ink bg-white px-4 text-base text-ink shadow-hard-sm outline-none placeholder:text-ink-3 disabled:bg-mist disabled:shadow-none"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!canType || !text.trim()}
              className="press flex h-[52px] w-[52px] flex-none cursor-pointer items-center justify-center rounded-2xl border-[2.5px] border-ink bg-coral font-display text-2xl font-extrabold text-ink shadow-hard-sm disabled:cursor-default disabled:bg-mist disabled:text-ink-3 disabled:shadow-none"
            >
              →
            </button>
          </form>
          {spec?.hint && (
            <p className="mx-auto mb-0 mt-2 max-w-[720px] text-[13px] text-ink-3">
              Tip: you can tell me everything in one go.{" "}
              <button type="button" onClick={() => setText(EXAMPLE)} className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-bold text-ink underline">
                Try an example
              </button>
            </p>
          )}
        </div>
      </section>

      <aside className="hidden overflow-y-auto border-l-[2.5px] border-ink bg-sky p-6 lg:block">
        <TeaCard draft={draft} />
      </aside>
    </div>
  );
}

function BotRow({ hideFace, children }: { hideFace?: boolean; children: React.ReactNode }) {
  return (
    <div className="pop-in flex items-end gap-2.5">
      <span
        aria-hidden="true"
        className={cx("flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border-2 border-ink bg-white shadow-hard-xs", hideFace && "invisible")}
      >
        <img src="/brand/svg/giftea-symbol.svg" alt="" className="w-6" />
      </span>
      {children}
    </div>
  );
}

function MeBubble({ text }: { text: string }) {
  return (
    <div className="pop-in flex justify-end">
      <div className="max-w-[80%] rounded-[20px] rounded-br-md border-[2.5px] border-ink bg-sun px-4 py-2.5 font-bold shadow-hard-sm">{text}</div>
    </div>
  );
}

function DatePick({ onDone }: { onDone: (md: string | null, shown: string) => void }) {
  const [m, setM] = useState<number | undefined>();
  const [d, setD] = useState<number | undefined>();
  return (
    <div className="pop-in ml-12 flex max-w-sm flex-col gap-3 rounded-[20px] border-[2.5px] border-ink bg-white p-4 shadow-hard-sm">
      <MonthDay idPrefix="chat-date" month={m} day={d} onChange={(mm, dd) => (setM(mm), setD(dd))} />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!m || !d}
          onClick={() => onDone(`${m}-${d}`, new Date(2024, m! - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "long" }))}
          className="press min-h-11 flex-1 cursor-pointer rounded-full border-2 border-ink bg-coral px-4 font-bold shadow-hard-xs disabled:cursor-default disabled:bg-mist disabled:shadow-none"
        >
          Save date
        </button>
        <button type="button" onClick={() => onDone(null, "Never mind")} className="min-h-11 cursor-pointer rounded-full border-2 border-dashed border-ink bg-transparent px-4 font-bold text-ink-2">
          Never mind
        </button>
      </div>
    </div>
  );
}

const CARD_STYLES = [
  { bg: "bg-cream", tilt: -1.5 },
  { bg: "bg-white", tilt: 1 },
  { bg: "bg-sky", tilt: -0.5 },
];

function ChatIdeas({ ideas, friendId, occasion }: { ideas: Idea[]; friendId: string; occasion: string }) {
  const friend = useFriend(friendId);
  const sorted = [...ideas].sort((a, b) => Number(b.isTopPick) - Number(a.isTopPick));

  function toggleSave(idea: Idea) {
    updateFriend(friendId, (f) => ({
      ...f,
      shortlist: f.shortlist.some((s) => s.title === idea.title) ? f.shortlist.filter((s) => s.title !== idea.title) : [...f.shortlist, idea],
    }));
  }
  function choose(idea: Idea) {
    updateFriend(friendId, (f) =>
      f.gifts.some((g) => g.title === idea.title)
        ? f
        : { ...f, gifts: [...f.gifts, { id: uid(), year: new Date().getFullYear(), occasion, title: idea.title }], shortlist: f.shortlist.filter((s) => s.title !== idea.title) },
    );
  }

  return (
    <div className="no-scrollbar -mx-4 grid auto-cols-[min(80%,300px)] grid-flow-col gap-3.5 overflow-x-auto px-4 pb-3 pl-16 pt-4 [scroll-snap-type:x_mandatory] @2xl:mx-0 @2xl:auto-cols-auto @2xl:grid-flow-row @2xl:grid-cols-3 @2xl:overflow-visible @2xl:px-0 @2xl:pl-12">
      {sorted.map((idea, i) => {
        const saved = !!friend?.shortlist.some((s) => s.title === idea.title);
        const chosen = !!friend?.gifts.some((g) => g.title === idea.title);
        const style = idea.isTopPick ? { bg: "bg-coral", tilt: -1.5 } : CARD_STYLES[i % 3];
        return (
          <article
            key={idea.title}
            className={cx("pop-in relative flex snap-center flex-col gap-2 rounded-[20px] border-[2.5px] border-ink p-4 shadow-hard", style.bg)}
            style={{ rotate: `${style.tilt}deg`, animationDelay: `${i * 110}ms` }}
          >
            {idea.isTopPick && (
              <span className="self-start rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-xs font-bold">Top pick</span>
            )}
            <h3 className="m-0 font-display text-[19px] font-extrabold leading-tight">{idea.title}</h3>
            <p className={cx("m-0 flex-1 text-sm leading-[1.45]", !idea.isTopPick && "text-ink-2")}>{idea.why}</p>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                aria-pressed={saved}
                onClick={() => toggleSave(idea)}
                aria-label={saved ? `Remove ${idea.title} from shortlist` : `Save ${idea.title} to shortlist`}
                className={cx("press flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-full border-2 border-ink", saved ? "bg-sun" : "bg-white")}
              >
                <HeartIcon filled={saved} size={18} />
              </button>
              <button
                type="button"
                onClick={() => choose(idea)}
                disabled={chosen}
                className={cx(
                  "press flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border-2 border-ink text-sm font-bold disabled:cursor-default",
                  chosen ? "bg-mint" : "bg-white",
                )}
              >
                {chosen ? (
                  <>
                    <CheckIcon size={16} /> Chosen!
                  </>
                ) : (
                  "This one!"
                )}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

const DRAFT_ROWS: Array<[keyof Draft, string]> = [
  ["relationship", "Who they are to you"],
  ["occasion", "Occasion"],
  ["budget", "Budget"],
];

function TeaCard({ draft }: { draft: Draft }) {
  const has = draft.name || draft.relationship || draft.occasion || draft.likes.length || draft.tea.length;
  return (
    <>
      <div className="rounded-3xl border-[2.5px] border-ink bg-white p-5 shadow-hard-md" style={{ rotate: "1deg" }}>
        <div className="flex items-center gap-3">
          {draft.name ? (
            <Avatar name={draft.name} color={draft.color ?? "#FFC93C"} size={56} />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-[2.5px] border-ink bg-sun font-display text-2xl font-extrabold">?</span>
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wide text-ink-3">The tea on</div>
            <div className="font-display text-2xl font-extrabold leading-tight [overflow-wrap:anywhere]">{draft.name ? firstName({ name: draft.name }) : "Someone special"}</div>
          </div>
        </div>

        {!has ? (
          <p className="mb-0 mt-4 text-sm text-ink-2">Everything you tell me shows up here, and gets saved to their profile for next time.</p>
        ) : (
          <dl className="m-0 mt-4 flex flex-col gap-3">
            {DRAFT_ROWS.map(([k, label]) =>
              draft[k] ? (
                <div key={k} className="pop-in border-b-2 border-dashed border-mist pb-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink-3">{label}</dt>
                  <dd className="m-0 font-bold">{draft[k] as string}</dd>
                </div>
              ) : null,
            )}
            {draft.likes.length > 0 && (
              <div className="pop-in border-b-2 border-dashed border-mist pb-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-3">Loves</dt>
                <dd className="m-0 mt-1.5 flex flex-wrap gap-1.5">
                  {draft.likes.map((l) => (
                    <span key={l} className="rounded-full border-2 border-ink bg-mint px-2.5 py-0.5 text-[13px] font-bold">
                      {l}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {draft.tea.slice(-6).map((t, i) => (
              <div key={`${t.topic}-${i}`} className="pop-in border-b-2 border-dashed border-mist pb-3 last:border-0 last:pb-0">
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-3">{t.topic}</dt>
                <dd className="m-0 font-bold">{t.answer}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      {draft.friendId ? (
        <Link href={`/friend/${draft.friendId}`} className="mt-6 inline-block text-[15px] font-bold">
          Open {draft.name ? possessive({ name: draft.name }) : "their"} full profile →
        </Link>
      ) : (
        <p className="mt-6 text-[13px] leading-relaxed text-ink-2">
          Prefer forms and lists? Switch to <b>Classic</b> at the top any time. Everything you save works in both.
        </p>
      )}
    </>
  );
}
