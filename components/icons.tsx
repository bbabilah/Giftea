type P = { size?: number; className?: string; strokeWidth?: number };

function Svg({ size = 20, className, strokeWidth = 2.4, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const BackIcon = (p: P) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>;
export const ChevronRight = (p: P) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;
export const ChevronDown = (p: P) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>;
export const PencilIcon = (p: P) => <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></Svg>;
export const CheckIcon = (p: P) => <Svg strokeWidth={3} {...p}><path d="M5 12l5 5L20 7" /></Svg>;
export const CloseIcon = (p: P) => <Svg {...p}><path d="M18 6L6 18M6 6l12 12" /></Svg>;
export const PlusIcon = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const TrashIcon = (p: P) => <Svg strokeWidth={2.2} {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></Svg>;
export const ChatIcon = (p: P) => <Svg strokeWidth={2} {...p}><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" /></Svg>;
export const ShakeIcon = (p: P) => <Svg {...p}><path d="M21 12a9 9 0 11-3-6.7L21 8" /><path d="M21 3v5h-5" /></Svg>;
export const CalendarIcon = (p: P) => <Svg strokeWidth={2.2} {...p}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 10h18" /></Svg>;

export function HeartIcon({ filled, ...p }: P & { filled?: boolean }) {
  return (
    <svg
      width={p.size ?? 20}
      height={p.size ?? 20}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={p.className}
    >
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}

export function GiftIcon({ size = 36, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z" />
    </svg>
  );
}
