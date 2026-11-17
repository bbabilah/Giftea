"use client";

import { useSyncExternalStore } from "react";

/** How the home screen works: a guided chat, or the classic friends list and pages. */
export type Layout = "chat" | "classic";

const KEY = "giftea.layout";
const DEFAULT: Layout = "chat";
const listeners = new Set<() => void>();

function read(): Layout {
  try {
    const v = localStorage.getItem(KEY);
    return v === "classic" || v === "chat" ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setLayout(layout: Layout) {
  try {
    localStorage.setItem(KEY, layout);
  } catch {
    // Storage blocked: the switch still works for this visit.
    memo = layout;
  }
  listeners.forEach((l) => l());
}

let memo: Layout | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Null until the browser has loaded (server render / hydration). */
export function useLayout(): Layout | null {
  return useSyncExternalStore(subscribe, () => memo ?? read(), () => null);
}
