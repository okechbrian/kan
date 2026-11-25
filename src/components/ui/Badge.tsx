import type { ReactNode } from "react";

export type BadgeTone = "teal" | "guava" | "navy" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  teal: "bg-teal-soft text-navy",
  guava: "bg-guava-soft text-navy",
  navy: "bg-navy text-softwhite",
  neutral: "bg-navy/5 text-navy/75",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${TONE_CLASSES[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
