import type { ReactNode } from "react";

export type FeatureState = "now" | "soon" | "partner";

const LABELS: Record<FeatureState, string> = {
  now: "Available now",
  soon: "Coming soon",
  partner: "With partner",
};

const CLASSES: Record<FeatureState, string> = {
  now: "state-now",
  soon: "state-soon",
  partner: "state-partner",
};

export function StatusBadge({
  state,
  children,
}: {
  state: FeatureState;
  children?: ReactNode;
}) {
  return <span className={CLASSES[state]}>{children ?? LABELS[state]}</span>;
}
