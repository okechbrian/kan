import type { HTMLAttributes, ReactNode } from "react";

export type CardSurface = "light" | "navy" | "teal-soft";

const SURFACE_CLASSES: Record<CardSurface, string> = {
  light: "rounded-2xl border border-navy/10 bg-white p-5 shadow-sm text-navy",
  navy: "rounded-2xl border border-white/10 bg-navy p-5 shadow-sm text-softwhite",
  "teal-soft": "rounded-2xl border border-teal/40 bg-teal-soft p-5 shadow-sm text-navy",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface;
  children: ReactNode;
}

export function Card({
  surface = "light",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div className={`${SURFACE_CLASSES[surface]} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
