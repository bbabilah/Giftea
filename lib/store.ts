"use client";

import { useSyncExternalStore } from "react";
import type { Friend } from "./types";

const KEY = "giftea.v1";
/** Data saved under the old working name; moved over on first load. */
const LEGACY_KEY = "psst.v1";
const AVATAR_COLORS = ["#FF5A36", "#5B8CFF", "#7BDCB5", "#FFC93C", "#FFE3EA"];

interface State {
  friends: Friend[];
}

let cache: State | null = null;
const listeners = new Set<() => void>();

export function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function normalizeFriend(f: Partial<Friend>): Friend {
  return {
    id: f.id ?? uid(),
    name: f.name ?? "Friend",
    nickname: f.nickname || undefined,
    relationship: f.relationship || undefined,
    pronoun: f.pronoun ?? "they",
    color: f.color ?? AVATAR_COLORS[0],
    tags: Array.isArray(f.tags) ? f.tags : [],
    answers: f.answers && typeof f.answers === "object" ? f.answers : {},
    // "Just because" was removed as an occasion; drop it from older saved data.
    occasions: Array.isArray(f.occasions) ? f.occasions.filter((o) => (o.kind as string) !== "just-because") : [],
    gifts: Array.isArray(f.gifts) ? f.gifts : [],
    shortlist: Array.isArray(f.shortlist) ? f.shortlist : [],
    lastIdeas: f.lastIdeas,
    createdAt: f.createdAt ?? Date.now(),
  };
}

function read(): State {
  if (cache) return cache;
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        localStorage.setItem(KEY, raw);
        localStorage.removeItem(LEGACY_KEY);
      }
    }
    const parsed = raw ? JSON.parse(raw) : null;
    const friends = Array.isArray(parsed?.friends) ? parsed.friends.map(normalizeFriend) : [];
    cache = { friends };
  } catch {
    cache = { friends: [] };
  }
  return cache;
}

function write(next: State) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep working in memory for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns null until the browser store is loaded (server render / hydration). */
export function useFriends(): Friend[] | null {
  const state = useSyncExternalStore(subscribe, read, () => null);
  return state ? state.friends : null;
}

export function useFriend(id: string): Friend | null | undefined {
  const friends = useFriends();
  if (!friends) return undefined; // still loading
  return friends.find((f) => f.id === id) ?? null;
}

export function addFriend(input: Pick<Friend, "name" | "nickname" | "relationship" | "pronoun"> & Partial<Friend>): Friend {
  const state = read();
  const friend = normalizeFriend({
    ...input,
    id: uid(),
    color: AVATAR_COLORS[state.friends.length % AVATAR_COLORS.length],
    createdAt: Date.now(),
  });
  write({ friends: [...state.friends, friend] });
  return friend;
}

export function updateFriend(id: string, fn: (f: Friend) => Friend) {
  const state = read();
  write({ friends: state.friends.map((f) => (f.id === id ? fn(f) : f)) });
}

export function deleteFriend(id: string) {
  const state = read();
  write({ friends: state.friends.filter((f) => f.id !== id) });
}
