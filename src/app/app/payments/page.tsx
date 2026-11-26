import { PaymentsPanel } from "../../../components/payments/PaymentsPanel";
import { StatusBadge } from "../../../components/site/StatusBadge";

export const metadata = { title: "Payments & reconciliation" };

export default function AppPaymentsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Payments &amp; reconciliation
          </h1>
          <p className="mt-1 text-sm text-navy/65">
            Cash, MTN MoMo, Airtel Money, and credit (deni) totals in integer UGX.
          </p>
        </div>
        <StatusBadge state="now" />
      </header>

      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-navy">
            Uganda Collection Webhooks (MTN MoMo / Airtel Money / Flutterwave)
          </h2>
          <StatusBadge state="partner" />
        </div>
        <p className="mt-2 text-sm text-navy/70">
          Manual payment confirmation works offline today. When you obtain merchant API
          credentials from MTN MoMo, Airtel Money, or Flutterwave Uganda, point your
          webhook URL to <code className="rounded bg-navy/5 px-1.5 py-0.5 text-xs">/api/payments/webhook</code>{" "}
          and configure <code className="rounded bg-navy/5 px-1.5 py-0.5 text-xs">FLW_WEBHOOK_SECRET</code>{" "}
          or <code className="rounded bg-navy/5 px-1.5 py-0.5 text-xs">MOMO_WEBHOOK_SECRET</code>.
          HMAC-SHA256 signatures and integer UGX amounts are enforced automatically.
        </p>
      </section>

      <PaymentsPanel />
    </div>
  );
}
