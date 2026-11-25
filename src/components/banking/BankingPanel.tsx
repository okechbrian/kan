import { PARTNER_FEATURES, partnerMessage } from "../../lib/banking/partners";
import { EmptyPanel } from "../dashboard/EmptyPanel";
import { StatusBadge } from "../site/StatusBadge";

export function BankingPanel() {
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight">Business banking</h1>
        <StatusBadge state="partner" />
      </header>
      <p className="text-sm text-ink/60">
        Kan does not hold money. These features need a licensed partner and are never
        simulated here.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {PARTNER_FEATURES.map((feature) => (
          <EmptyPanel
            key={feature.id}
            title={feature.name}
            message={partnerMessage(feature.id)}
            state="partner"
          />
        ))}
      </div>
    </div>
  );
}
