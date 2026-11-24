import Link from "next/link";
import { EmptyPanel } from "./EmptyPanel";
import { StatusBadge, type FeatureState } from "../site/StatusBadge";

export function SimplePage({
  title,
  description,
  message,
  state = "soon",
  action,
}: {
  title: string;
  description: string;
  message: string;
  state?: FeatureState;
  action?: { label: string; href: string };
}) {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <StatusBadge state={state} />
        </div>
        <p className="mt-2 text-sm text-ink/60">{description}</p>
      </header>
      <EmptyPanel
        title={title}
        message={message}
        state={state}
        action={
          action ? (
            <Link href={action.href} className="btn-secondary text-sm">
              {action.label}
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}
