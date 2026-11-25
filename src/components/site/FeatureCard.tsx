import type { ReactNode } from "react";
import { StatusBadge, type FeatureState } from "./StatusBadge";

export function FeatureCard({
  icon,
  title,
  description,
  state,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  state: FeatureState;
}) {
  return (
    <article className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-soft text-navy"
          aria-hidden="true"
        >
          {icon}
        </span>
        <StatusBadge state={state} />
      </div>
      <h3 className="text-lg font-bold text-navy">{title}</h3>
      <p className="text-sm leading-relaxed text-navy/65">{description}</p>
    </article>
  );
}
