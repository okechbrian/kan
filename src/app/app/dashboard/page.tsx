import Link from "next/link";
import { EmptyPanel } from "../../../components/dashboard/EmptyPanel";
import { StatusBadge } from "../../../components/site/StatusBadge";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
          <StatusBadge state="soon" />
        </div>
        <p className="mt-2 text-sm text-ink/60">
          One view of the shop when there is something to show.
        </p>
      </header>

      <section className="card border-kan/20 bg-kan-soft/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">The till is ready</h2>
              <StatusBadge state="now" />
            </div>
            <p className="mt-2 text-sm text-ink/65">
              Sell offline, receive stock, record deni and close the day.
            </p>
          </div>
          <Link href="/pos" className="btn-primary">
            Open your till
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <EmptyPanel
          title="Today's sales"
          message="No sales recorded yet. Open the till to begin."
          state="now"
          action={
            <Link href="/sell" className="btn-secondary text-sm">
              Go to sell
            </Link>
          }
        />
        <EmptyPanel
          title="Stock alerts"
          message="No low-stock items yet. Stock appears after your first receive."
          state="now"
          action={
            <Link href="/stock" className="btn-secondary text-sm">
              Go to stock
            </Link>
          }
        />
        <EmptyPanel
          title="Channels"
          message="Online store not open yet. Storefront opens with the online store release."
          state="soon"
        />
        <EmptyPanel
          title="Reports"
          message="Reports appear after the first closed shift."
          state="soon"
        />
      </div>
    </div>
  );
}
