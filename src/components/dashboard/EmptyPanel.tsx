import type { ReactNode } from "react";
import { StatusBadge, type FeatureState } from "../site/StatusBadge";

export function EmptyPanel({
  title,
  message,
  state = "soon",
  action,
}: {
  title: string;
  message: string;
  state?: FeatureState;
  action?: ReactNode;
}) {
  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        <StatusBadge state={state} />
      </div>
      <div className="mt-4 flex min-h-28 flex-col items-start justify-center rounded-xl border border-dashed border-black/10 bg-cream/60 p-5">
        <p className="text-sm font-medium text-ink/70">{message}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </section>
  );
}
