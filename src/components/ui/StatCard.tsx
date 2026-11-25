import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "teal" | "guava" | "neutral";
  icon?: ReactNode;
  className?: string;
}

const DELTA_CLASSES = {
  teal: "bg-teal-soft text-navy",
  guava: "bg-guava-soft text-navy",
  neutral: "bg-navy/5 text-navy/75",
} as const;

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "teal",
  icon,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border border-navy/10 bg-white p-5 shadow-sm ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-navy/60">
          {label}
        </p>
        {icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-soft text-navy">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="ugx-amount text-2xl font-bold tracking-tight text-navy">
          {value}
        </p>
        {delta ? (
          <span
            className={`ugx-amount rounded-full px-2 py-0.5 text-xs font-bold ${DELTA_CLASSES[deltaTone]}`}
          >
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
