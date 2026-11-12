"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { friendSubtitle, sortBySoonest } from "@/lib/occasions";
import { addFriend, uid, useFriends } from "@/lib/store";
import { presetFor } from "@/lib/occasions";
import { Logo } from "./brand";
import { FriendForm, type FriendDraft } from "./forms";
import { Avatar, ButtonLink, Card, Modal, cx } from "./ui";

export function useAddFriend() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const modal = (
    <Modal open={open} onClose={() => setOpen(false)} title="Who are we spoiling?">
      <FriendForm
        withBirthday
        submitLabel="Add to my people"
        onSubmit={(d: FriendDraft) => {
          const f = addFriend({
            name: d.name,
            nickname: d.nickname,
            relationship: d.relationship,
            pronoun: d.pronoun,
            occasions: d.birthday
              ? [{ id: uid(), kind: "birthday", label: presetFor("birthday").label, recurring: true, ...d.birthday }]
              : [],
          });
          setOpen(false);
          router.push(`/friend/${f.id}`);
        }}
      />
    </Modal>
  );
  return { open: () => setOpen(true), modal };
}

export function FriendsNav({ activeId }: { activeId?: string }) {
  const friends = useFriends();
  const add = useAddFriend();
  const sorted = friends ? sortBySoonest(friends) : [];

  return (
    <nav
      aria-label="Your people"
      className="flex flex-col gap-3.5 rounded-3xl border-[2.5px] border-ink bg-white p-[22px] shadow-hard-md"
    >
      <Link href="/" className="flex self-start">
        <Logo variant="lockup" height={60} className="-my-1" />
      </Link>
      <div className="text-[13px] font-bold tracking-wide text-ink-3">YOUR PEOPLE</div>
      {sorted.map((f) => {
        const active = f.id === activeId;
        return (
          <Link
            key={f.id}
            href={`/friend/${f.id}`}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex items-center gap-3 rounded-2xl border-2 p-2.5 no-underline transition-colors",
              active ? "border-ink bg-sun" : "border-transparent hover:bg-pink/60",
            )}
          >
            <Avatar name={f.name} color={f.color} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-bold">{f.name}</span>
              <span className={cx("block truncate text-xs", !active && "text-ink-3")}>{friendSubtitle(f)}</span>
            </span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={add.open}
        className="press h-12 cursor-pointer rounded-2xl border-2 border-dashed border-ink bg-transparent text-[15px] font-bold text-ink"
      >
        + Add a friend
      </button>
      {add.modal}
    </nav>
  );
}

export function Shell({
  bg,
  activeId,
  sidebar = true,
  children,
}: {
  bg: string;
  activeId?: string;
  sidebar?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-clip" style={{ background: bg }}>
      <div className="mx-auto flex max-w-[1400px] gap-7 lg:p-7">
        {sidebar && (
          <aside className="sticky top-7 hidden w-[290px] flex-none self-start lg:block">
            <FriendsNav activeId={activeId} />
          </aside>
        )}
        <main className="relative min-w-0 flex-1 px-5 pb-8 pt-6 lg:p-0">{children}</main>
      </div>
    </div>
  );
}

export function Loading({ bg }: { bg: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center" style={{ background: bg }}>
      <Logo variant="symbol" height={72} className="wiggle" decorative />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function NotFound() {
  return (
    <Shell bg="#FFE3EA">
      <Card tilt={-1} className="mx-auto mt-16 flex max-w-md flex-col items-start gap-4 bg-sun p-6">
        <h1 className="m-0 font-display text-3xl font-extrabold">Hmm, can’t find them.</h1>
        <p className="m-0">This friend isn’t saved in this browser. Your people live on this device only.</p>
        <ButtonLink href="/" variant="primary" className="h-14 w-full">
          Back to your people
        </ButtonLink>
      </Card>
    </Shell>
  );
}

