"use client";

import { setLayout, type Layout } from "@/lib/layout";
import { cx } from "./ui";

const OPTIONS: { value: Layout; label: string; icon: string }[] = [
  { value: "chat", label: "Chat", icon: "💬" },
  { value: "classic", label: "Classic", icon: "🗂️" },
];

/** Lets people pick between the guided chat and the classic layout. Remembered on this device. */
export function LayoutSwitch({ value, className }: { value: Layout; className?: string }) {
  return (
    <div
      role="radiogroup"
      aria-label="Layout"
      className={cx("inline-flex flex-none rounded-full border-[2.5px] border-ink bg-white p-1 shadow-hard-xs", className)}
    >
      {OPTIONS.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setLayout(o.value)}
            className={cx(
              "flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink transition-colors",
              on ? "bg-ink text-white" : "bg-transparent hover:bg-pink",
            )}
          >
            <span aria-hidden="true">{o.icon}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
