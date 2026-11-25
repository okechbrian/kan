import Link from "next/link";
import { CalendarClock, Layers, PackagePlus, QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import { FeatureCard } from "../../components/site/FeatureCard";
import { SharedBottomFunnel } from "../../components/site/SharedBottomFunnel";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";

const FEATURES = [
  {
    icon: <PackagePlus className="h-5 w-5" />,
    title: "Quick item addition",
    description:
      "Register goods in seconds by piece, kg, gram, litre or metre with brand, reorder level and buying/selling UGX prices.",
    state: "now" as const,
  },
  {
    icon: <CalendarClock className="h-5 w-5" />,
    title: "Production & expiry dates",
    description:
      "Track FIFO batches and close-to-expiry stock for pharmacies, groceries, bakeries and agro shops.",
    state: "now" as const,
  },
  {
    icon: <RefreshCw className="h-5 w-5" />,
    title: "Movement-based sync",
    description:
      "Stock levels are computed from immutable movements (sales, receives, adjustments, voids) so concurrent offline sales never overwrite each other.",
    state: "now" as const,
  },
  {
    icon: <QrCode className="h-5 w-5" />,
    title: "Barcode & QR code support",
    description:
      "Use any USB keyboard-wedge scanner or camera to add stock and check out faster without requiring barcodes for loose goods.",
    state: "now" as const,
  },
  {
    icon: <Layers className="h-5 w-5" />,
    title: "Warehouses & branch transfers",
    description:
      "Move inventory between shops and storage rooms with a full transfer log.",
    state: "now" as const,
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Simple for every attendant",
    description:
      "Never block a counter sale because a count hit zero — negative stock raises a warning instead of losing a customer.",
    state: "now" as const,
  },
];

export default function ManageInventoryPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="max-w-3xl">
            <p className="eyebrow">Inventory management</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
              Keep your stock organised across shelves, branches and online.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-navy/75">
              Every sale deducts stock automatically. Receive deliveries, adjust counts
              with a reason, and catch low-stock or expiring items before they run out.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/stock" className="btn-primary">
                Open stock view
              </Link>
              <Link href="/app/signup" className="btn-secondary">
                Create workspace
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </section>
        <SharedBottomFunnel />
      </main>
      <SiteFooter />
    </>
  );
}
