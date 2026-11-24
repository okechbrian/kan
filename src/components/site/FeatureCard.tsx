import { StatusBadge, type FeatureState } from "./StatusBadge";

export function FeatureCard({
  icon,
  title,
  description,
  state,
}: {
  icon: string;
  title: string;
  description: string;
  state: FeatureState;
}) {
  return (
    <article className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
        <StatusBadge state={state} />
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-ink/60">{description}</p>
    </article>
  );
}
