"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { initials } from "@/lib/pronouns";
import { CloseIcon } from "./icons";

export function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "mint" | "sun" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary: "bg-coral font-display font-extrabold text-[17px] shadow-hard",
  mint: "bg-mint font-display font-extrabold text-[17px] shadow-hard",
  sun: "bg-sun font-display font-extrabold text-[17px] shadow-hard",
  secondary: "bg-white font-bold text-[15px] shadow-hard-sm",
  ghost: "bg-transparent border-dashed font-bold text-[15px]",
};

const BASE =
  "press inline-flex items-center justify-center gap-2 min-h-[44px] rounded-[18px] border-[2.5px] border-ink text-ink px-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed no-underline";

export function Button({
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={cx(BASE, VARIANT[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "secondary",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(BASE, VARIANT[variant], className)} {...props} />;
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "press flex h-11 w-11 flex-none items-center justify-center rounded-[14px] border-[2.5px] border-ink bg-white text-ink shadow-hard-sm cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconLink({ label, className, children, ...props }: React.ComponentProps<typeof Link> & { label: string }) {
  return (
    <Link
      aria-label={label}
      title={label}
      className={cx(
        "press flex h-11 w-11 flex-none items-center justify-center rounded-[14px] border-[2.5px] border-ink bg-white text-ink shadow-hard-sm",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Chip({
  pressed,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cx(
        "press inline-flex h-11 flex-none items-center gap-1.5 rounded-full border-2 border-ink px-4 text-[15px] text-ink cursor-pointer",
        pressed ? "bg-sun font-bold shadow-hard-xs" : "bg-white font-medium",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex flex-none items-center justify-center rounded-full border-ink font-display font-extrabold"
      style={{
        width: size,
        height: size,
        background: color,
        borderWidth: size > 50 ? 2.5 : 2,
        fontSize: Math.round(size * 0.38),
      }}
    >
      {initials(name)}
    </span>
  );
}

export function Card({ className, children, tilt = 0, ...rest }: React.HTMLAttributes<HTMLDivElement> & { tilt?: number }) {
  return (
    <div
      className={cx(
        "rounded-3xl border-[2.5px] border-ink p-5",
        !/(^|\s)bg-/.test(className ?? "") && "bg-white",
        !/(^|\s)shadow-/.test(className ?? "") && "shadow-hard-md",
        className,
      )}
      style={tilt ? { rotate: `${tilt}deg` } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className="m-auto w-[min(520px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] overflow-visible bg-transparent p-0 text-ink"
    >
      {open && (
        <div className="pop-in max-h-[calc(100dvh-24px)] overflow-y-auto rounded-3xl border-[2.5px] border-ink bg-white p-5 shadow-hard-lg sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="m-0 font-display text-2xl font-extrabold leading-tight">{title}</h2>
            <IconButton label="Close" onClick={onClose} className="shadow-none">
              <CloseIcon />
            </IconButton>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">
        {label}
        {hint && <span className="font-normal text-ink-3"> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-[48px] w-full rounded-[14px] border-2 border-ink bg-white px-3.5 text-base text-ink placeholder:text-ink-3/70";

/** Scattered confetti shapes, purely decorative. */
export function Confetti({ variant = 0, className }: { variant?: number; className?: string }) {
  const sets = [
    <>
      <rect x="300" y="70" width="14" height="14" rx="3" fill="#FFC93C" transform="rotate(20 307 77)" />
      <circle cx="40" cy="96" r="6" fill="#5B8CFF" />
      <path d="M250 30 q8 -10 16 0 t16 0" stroke="#FF5A36" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="352" cy="200" r="5" fill="#7BDCB5" />
      <rect x="20" y="220" width="10" height="20" rx="3" fill="#FF5A36" transform="rotate(-25 25 230)" />
    </>,
    <>
      <circle cx="340" cy="130" r="7" fill="#FF5A36" />
      <rect x="300" y="186" width="12" height="12" rx="3" fill="#FFC93C" transform="rotate(30 306 192)" />
      <path d="M24 230 q8 -10 16 0 t16 0" stroke="#7BDCB5" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="120" cy="30" r="5" fill="#5B8CFF" />
    </>,
    <>
      <rect x="200" y="40" width="12" height="22" rx="3" fill="#FF5A36" transform="rotate(25 206 51)" />
      <circle cx="330" cy="30" r="6" fill="#5B8CFF" />
      <rect x="360" y="110" width="12" height="12" rx="3" fill="#7BDCB5" transform="rotate(-20 366 116)" />
      <path d="M250 150 q8 -10 16 0 t16 0" stroke="#FF5A36" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="300" cy="90" r="4" fill="#FF5A36" />
      <rect x="160" y="100" width="10" height="10" rx="2" fill="#5B8CFF" transform="rotate(40 165 105)" />
    </>,
  ];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 390 260"
      preserveAspectRatio="xMaxYMin meet"
      className={cx("pointer-events-none absolute right-0 top-0 h-[260px] w-[390px] max-w-full", className)}
    >
      {sets[variant % sets.length]}
    </svg>
  );
}
