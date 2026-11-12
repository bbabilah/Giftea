"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FriendForm, GiftForm, OccasionForm, REACTIONS } from "@/components/forms";
import { BackIcon, CalendarIcon, CloseIcon, GiftIcon, HeartIcon, PencilIcon, PlusIcon } from "@/components/icons";
import { Loading, NotFound, Shell } from "@/components/shell";
import { Logo } from "@/components/brand";
import { Avatar, Button, ButtonLink, Card, Confetti, IconButton, IconLink, Modal, cx } from "@/components/ui";
import { countdownText, nextDate, nextOccasion, shortDate } from "@/lib/occasions";
import { fill, firstName, forms } from "@/lib/pronouns";
import { deleteFriend, updateFriend, useFriend } from "@/lib/store";
import type { Friend, Gift, Occasion } from "@/lib/types";

const BG = "#FFE3EA";

export default function FriendPage() {
  const { id } = useParams<{ id: string }>();
  const friend = useFriend(id);
  if (friend === undefined) return <Loading bg={BG} />;
  if (friend === null) return <NotFound />;
  return <Profile friend={friend} />;
}

function tagline(f: Friend) {
  if (f.nickname) return `To ${f.nickname}`;
  return f.relationship ?? "";
}

function Profile({ friend }: { friend: Friend }) {
  const router = useRouter();
  const name = firstName(friend);
  const p = forms(friend.pronoun);
  const up = nextOccasion(friend);
  const shared = friend.tags.length + Object.keys(friend.answers).length;

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [occasionModal, setOccasionModal] = useState<Occasion | "new" | null>(null);
  const [giftModal, setGiftModal] = useState<Gift | "new" | null>(null);

  const update = (fn: (f: Friend) => Friend) => updateFriend(friend.id, fn);

  const progressText =
    shared === 0
      ? fill("You haven’t spilled any tea yet. Answer a few fun questions and {their} gift ideas get way better.", friend)
      : shared >= 18
        ? fill(`You know {name} so well. Keep the tea fresh, people change!`, friend)
        : fill(
            `You’ve shared ${shared} thing${shared === 1 ? "" : "s"} so far — a little more tea and {their} gift ideas get even better.`,
            friend,
          );

  return (
    <Shell bg={BG} activeId={friend.id}>
      <Confetti variant={0} className="lg:hidden" />

      {/* Mobile top bar */}
      <div className="relative mb-5 flex items-center justify-between lg:hidden">
        <IconLink href="/" label="Back to your people">
          <BackIcon />
        </IconLink>
        <Link href="/" className="flex">
          <Logo variant="wordmark" height={34} />
        </Link>
        <IconButton label={`Edit ${name}`} onClick={() => setEditing(true)}>
          <PencilIcon />
        </IconButton>
      </div>

      {/* Desktop heading */}
      <div className="mb-6 hidden flex-wrap items-end justify-between gap-4 lg:flex">
        <div>
          <div className="text-[15px] font-bold">{tagline(friend)}</div>
          <div className="flex items-center gap-3">
            <h1 className="m-0 font-display text-[56px] font-extrabold leading-none">{friend.name}</h1>
            <IconButton label={`Edit ${name}`} onClick={() => setEditing(true)} className="shadow-none">
              <PencilIcon size={18} />
            </IconButton>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/friend/${friend.id}/tea`} className="h-[54px] px-[22px]">
            Spill the tea on {name}
          </ButtonLink>
          <ButtonLink href={`/friend/${friend.id}/ideas`} variant="primary" className="h-[54px] px-[26px]">
            Gift ideas!
          </ButtonLink>
        </div>
      </div>

      <div className="relative grid gap-6 pb-24 lg:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] lg:pb-0">
        {/* Name tag + countdown */}
        <div
          className="relative flex flex-col gap-4 rounded-3xl border-[2.5px] border-ink bg-sun p-5 pt-[22px] shadow-hard-lg lg:p-6"
          style={{ rotate: "-1.5deg" }}
        >
          <div className="absolute right-[18px] top-4 h-[18px] w-[18px] rounded-full border-[2.5px] border-ink bg-pink" aria-hidden="true" />
          <div className="flex items-center gap-3.5">
            <Avatar name={friend.name} color={friend.color} size={68} />
            <div className="min-w-0 lg:hidden">
              {tagline(friend) && <div className="text-[13px] font-bold">{tagline(friend)}</div>}
              <h1 className="m-0 break-words font-display text-[30px] font-extrabold leading-none">{friend.name}</h1>
            </div>
          </div>
          <Countdown friend={friend} up={up} onAdd={() => setOccasionModal("new")} />
        </div>

        {/* Occasions */}
        <Card className="lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 font-display text-lg font-extrabold lg:text-[22px]">Occasions</h2>
            <button
              type="button"
              onClick={() => setOccasionModal("new")}
              className="press flex min-h-[44px] flex-none cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border-2 border-dashed border-ink bg-transparent px-3.5 text-sm font-bold"
            >
              <PlusIcon size={16} /> Add
            </button>
          </div>
          {friend.occasions.length === 0 ? (
            <p className="mb-0 mt-3 text-[15px] text-ink-2">
              Birthdays, anniversaries, a new job, or just because. Add one so you’re never caught out.
            </p>
          ) : (
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {[...friend.occasions]
                .sort((a, b) => (nextDate(a)?.getTime() ?? Infinity) - (nextDate(b)?.getTime() ?? Infinity))
                .map((o) => {
                  const passed = !o.recurring && !!o.year && !nextDate(o);
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => setOccasionModal(o)}
                        className={cx(
                          "flex min-h-[48px] w-full cursor-pointer items-center gap-3 rounded-[14px] border-2 border-ink bg-white px-3.5 text-left text-ink hover:bg-pink/50",
                          passed && "opacity-60",
                        )}
                      >
                        <CalendarIcon size={18} />
                        <span className="flex-1 font-bold">{o.label}</span>
                        <span className="text-sm text-ink-3">
                          {shortDate(o) || (o.kind === "just-because" ? "any day" : "no date")}
                          {o.recurring && shortDate(o) ? " · yearly" : ""}
                          {passed ? " · done" : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>

        {/* Things they love */}
        <Card className="lg:p-6">
          <h2 className="m-0 font-display text-lg font-extrabold lg:text-[22px]">Things {p.they} {p.loves}</h2>
          <Tags friend={friend} />
        </Card>

        {/* Gift history */}
        <Card className="lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 font-display text-lg font-extrabold lg:text-[22px]">Gifts you’ve given</h2>
            <button
              type="button"
              onClick={() => setGiftModal("new")}
              className="press flex min-h-[44px] flex-none cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border-2 border-dashed border-ink bg-transparent px-3.5 text-sm font-bold"
            >
              <PlusIcon size={16} /> Log one
            </button>
          </div>
          {friend.gifts.length === 0 ? (
            <p className="mb-0 mt-3 text-[15px] text-ink-2">
              Log what you’ve given before (and how it landed) so ideas never repeat and build on the hits.
            </p>
          ) : (
            <ul className="m-0 mt-3.5 grid list-none grid-cols-2 gap-3 p-0">
              {[...friend.gifts]
                .sort((a, b) => b.year - a.year)
                .map((g) => {
                  const r = REACTIONS.find((x) => x.value === g.reaction);
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => setGiftModal(g)}
                        className="press flex h-full w-full cursor-pointer flex-col items-start rounded-[18px] border-[2.5px] border-ink bg-pink p-3 text-left text-ink shadow-hard-sm"
                      >
                        <span className="text-xs font-bold text-ink-3">
                          {g.year} · {g.occasion}
                        </span>
                        <span className="mt-0.5 text-[15px] font-bold leading-snug">{g.title}</span>
                        <span
                          className="mt-2.5 inline-block rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold"
                          style={{ background: r?.color ?? "#fff", borderStyle: r ? "solid" : "dashed" }}
                        >
                          {r?.label ?? "How did it go?"}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>

        {/* Shortlist */}
        {friend.shortlist.length > 0 && (
          <Card className="lg:p-6">
            <h2 className="m-0 font-display text-lg font-extrabold lg:text-[22px]">Your shortlist</h2>
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {friend.shortlist.map((idea) => (
                <li key={idea.title} className="flex items-start gap-3 rounded-[14px] border-2 border-ink bg-cream p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{idea.title}</span>
                    <span className="block text-sm text-ink-2">{idea.why}</span>
                  </span>
                  <IconButton
                    label={`Remove ${idea.title} from shortlist`}
                    className="rounded-full bg-coral shadow-none"
                    onClick={() => update((f) => ({ ...f, shortlist: f.shortlist.filter((s) => s.title !== idea.title) }))}
                  >
                    <HeartIcon filled />
                  </IconButton>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Progress */}
        <div className="flex flex-col gap-3 rounded-[24px_24px_24px_6px] border-[2.5px] border-ink bg-sky p-5 shadow-hard-md lg:p-6">
          <div className="text-[13px] font-bold">So… what’s {name} like?</div>
          <div className="font-display text-xl font-extrabold leading-tight lg:text-2xl">{progressText}</div>
          <Link href={`/friend/${friend.id}/tea`} className="self-start text-[15px] font-bold">
            {shared === 0 ? "Start spilling →" : "Keep spilling →"}
          </Link>
        </div>
      </div>

      {/* Mobile bottom actions */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2.5 bg-gradient-to-t from-pink via-pink to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-6 lg:hidden">
        <ButtonLink href={`/friend/${friend.id}/tea`} className="h-14 flex-[1.3] px-2 text-[14px] leading-tight">
          Spill the tea on {name}
        </ButtonLink>
        <ButtonLink href={`/friend/${friend.id}/ideas`} variant="primary" className="h-14 flex-1 px-3">
          Gift ideas!
        </ButtonLink>
      </div>

      {/* Modals */}
      <Modal open={editing} onClose={() => (setEditing(false), setConfirmDelete(false))} title={`Edit ${name}`}>
        <FriendForm
          initial={friend}
          submitLabel="Save"
          onSubmit={(d) => {
            update((f) => ({ ...f, name: d.name, nickname: d.nickname, relationship: d.relationship, pronoun: d.pronoun }));
            setEditing(false);
          }}
        />
        <div className="mt-5 border-t-2 border-dashed border-ink/30 pt-4">
          {confirmDelete ? (
            <div className="flex flex-col gap-3">
              <p className="m-0 font-bold">Remove {friend.name} and everything you’ve saved about them? This can’t be undone.</p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setConfirmDelete(false)}>
                  Keep them
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    deleteFriend(friend.id);
                    router.push("/");
                  }}
                >
                  Yes, remove
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-[44px] cursor-pointer bg-transparent text-sm font-bold text-ink-2 underline">
              Remove {name} from your people
            </button>
          )}
        </div>
      </Modal>

      <Modal
        open={occasionModal !== null}
        onClose={() => setOccasionModal(null)}
        title={occasionModal === "new" ? `Add an occasion for ${name}` : "Edit occasion"}
      >
        {occasionModal !== null && (
          <>
            <OccasionForm
              key={occasionModal === "new" ? "new" : occasionModal.id}
              initial={occasionModal === "new" ? undefined : occasionModal}
              onSubmit={(o) => {
                update((f) => ({
                  ...f,
                  occasions: f.occasions.some((x) => x.id === o.id) ? f.occasions.map((x) => (x.id === o.id ? o : x)) : [...f.occasions, o],
                }));
                setOccasionModal(null);
              }}
            />
            {occasionModal !== "new" && (
              <button
                type="button"
                onClick={() => {
                  const oid = occasionModal.id;
                  update((f) => ({ ...f, occasions: f.occasions.filter((x) => x.id !== oid) }));
                  setOccasionModal(null);
                }}
                className="mt-3 min-h-[44px] cursor-pointer bg-transparent text-sm font-bold text-ink-2 underline"
              >
                Remove this occasion
              </button>
            )}
          </>
        )}
      </Modal>

      <Modal
        open={giftModal !== null}
        onClose={() => setGiftModal(null)}
        title={giftModal === "new" ? `Log a gift for ${name}` : "Edit gift"}
      >
        {giftModal !== null && (
          <>
            <GiftForm
              key={giftModal === "new" ? "new" : giftModal.id}
              friend={friend}
              initial={giftModal === "new" ? undefined : giftModal}
              onSubmit={(g) => {
                update((f) => ({
                  ...f,
                  gifts: f.gifts.some((x) => x.id === g.id) ? f.gifts.map((x) => (x.id === g.id ? g : x)) : [...f.gifts, g],
                }));
                setGiftModal(null);
              }}
            />
            {giftModal !== "new" && (
              <button
                type="button"
                onClick={() => {
                  const gid = giftModal.id;
                  update((f) => ({ ...f, gifts: f.gifts.filter((x) => x.id !== gid) }));
                  setGiftModal(null);
                }}
                className="mt-3 min-h-[44px] cursor-pointer bg-transparent text-sm font-bold text-ink-2 underline"
              >
                Remove from history
              </button>
            )}
          </>
        )}
      </Modal>
    </Shell>
  );
}

function Countdown({ friend, up, onAdd }: { friend: Friend; up: ReturnType<typeof nextOccasion>; onAdd: () => void }) {
  const box = "flex items-center justify-between gap-3 rounded-2xl border-[2.5px] border-ink bg-white px-3.5 py-3 lg:px-4 lg:py-3.5";
  if (!up) {
    return (
      <button type="button" onClick={onAdd} className={cx(box, "press min-h-[64px] cursor-pointer text-left text-ink")}>
        <span>
          <span className="block text-xs font-bold">No dates yet</span>
          <span className="block font-display text-[22px] font-extrabold">+ Add an occasion</span>
        </span>
        <GiftIcon />
      </button>
    );
  }
  return (
    <div className={box}>
      <div>
        <div className="text-xs font-bold lg:text-[13px]">
          {up.occasion.label}
          {up.date ? ` · ${shortDate(up.occasion)}` : ""}
        </div>
        <div className="font-display text-[22px] font-extrabold lg:text-[28px]">
          {up.days === null ? fill("Any day is a good day", friend) : countdownText(up.days)}
        </div>
      </div>
      <GiftIcon size={36} />
    </div>
  );
}

function Tags({ friend }: { friend: Friend }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  const save = () => {
    const t = value.trim();
    if (t && !friend.tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      updateFriend(friend.id, (f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setValue("");
  };

  return (
    <div className="mt-2.5 flex flex-wrap gap-2 lg:mt-3.5">
      {friend.tags.map((t, i) => (
        <span
          key={t}
          className={cx(
            "inline-flex items-center gap-1 rounded-full border-2 border-ink py-1 pl-3 pr-1 text-sm lg:text-[15px]",
            i === 0 ? "bg-mint font-bold" : "bg-white font-medium",
          )}
        >
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            onClick={() => updateFriend(friend.id, (f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-transparent text-ink hover:bg-ink/10"
          >
            <CloseIcon size={14} />
          </button>
        </span>
      ))}
      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            autoFocus
            aria-label="Something they love"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
              save();
              setAdding(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setValue("");
                setAdding(false);
              }
            }}
            placeholder="e.g. indoor plants"
            className="h-10 w-44 rounded-full border-2 border-ink bg-white px-3.5 text-sm"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="min-h-[36px] cursor-pointer rounded-full border-2 border-dashed border-ink bg-white px-3 text-sm font-bold lg:text-[15px]"
        >
          + add
        </button>
      )}
      {friend.tags.length === 0 && !adding && (
        <p className="m-0 w-full text-sm text-ink-3">{fill("Foods, hobbies, little obsessions — anything {they} {loves}.", friend)}</p>
      )}
    </div>
  );
}
