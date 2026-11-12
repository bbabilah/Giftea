/* eslint-disable @next/next/no-img-element -- static SVG logos, no optimisation needed */

const LOGOS = {
  lockup: { src: "/brand/svg/giftea-lockup.svg", ratio: 812 / 342 },
  wordmark: { src: "/brand/svg/giftea-wordmark.svg", ratio: 546 / 261 },
  symbol: { src: "/brand/svg/giftea-symbol.svg", ratio: 156 / 214 },
} as const;

export function Logo({
  variant = "wordmark",
  height,
  className,
  decorative,
}: {
  variant?: keyof typeof LOGOS;
  height: number;
  className?: string;
  /** Hide from screen readers when the name is already said nearby. */
  decorative?: boolean;
}) {
  const { src, ratio } = LOGOS[variant];
  return (
    <img
      src={src}
      alt={decorative ? "" : "Giftea"}
      width={Math.round(height * ratio)}
      height={height}
      className={className}
      draggable={false}
    />
  );
}
