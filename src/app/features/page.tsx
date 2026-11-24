import Link from "next/link";
import { FeatureCard } from "../../components/site/FeatureCard";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";

const GROUPS = [
  {
    title: "Running the shop today",
    items: [
      { icon: "▣", title: "Point of sale", description: "Fast counter sales with cash, MTN and Airtel money, split payments and deni. Works offline.", state: "now" as const },
      { icon: "▤", title: "Inventory", description: "Stock movements, receiving, adjustments, low-stock alerts and — later — batches and expiry.", state: "now" as const },
      { icon: "◉", title: "Customers and credit", description: "Phone-first customer records, running deni balance and collections, scoped per shop.", state: "now" as const },
      { icon: "◷", title: "Close the till", description: "Expected cash against counted cash, variance, MoMo totals and a clean end of shift.", state: "now" as const },
      { icon: "◈", title: "Shops and staff", description: "One owner, many shops; attendants bound to one shop with PIN access.", state: "now" as const },
    ],
  },
  {
    title: "Coming next",
    items: [
      { icon: "◇", title: "Payments", description: "Digital channels, card and bank transfer through licensed gateways, plus split payments and reconciliation.", state: "soon" as const },
      { icon: "◍", title: "Online store", description: "A shareable storefront synced with stock, checkout, delivery tracking and invoices.", state: "soon" as const },
      { icon: "◫", title: "Analytics", description: "Sales, product performance, expenses and profit-margin views with scheduled reports.", state: "soon" as const },
      { icon: "▧", title: "Warehouse and supply chain", description: "Transfers between shops, suppliers, purchase orders and production batches.", state: "soon" as const },
      { icon: "♙", title: "Bookings and services", description: "Appointments, staff schedules and deposits for service businesses.", state: "soon" as const },
      { icon: "◐", title: "Mobile and desktop apps", description: "Android, iOS and Windows clients with offline sync and POS hardware support.", state: "soon" as const },
      { icon: "✦", title: "AI assistant", description: "Natural-language questions about your own business data, with strict isolation and guardrails.", state: "partner" as const },
      { icon: "▢", title: "Business banking", description: "Balances, transfers and settlements through a licensed partner — never simulated here.", state: "partner" as const },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <p className="eyebrow">Features</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          What Kan does — and what is still on the way.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/60">
          Every capability is labelled. Available now means built and verified. Coming
          soon means on the roadmap. With partner means it needs a licensed provider.
        </p>
        <div className="mt-10 space-y-12">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="text-2xl font-black tracking-tight">{group.title}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <FeatureCard key={item.title} {...item} />
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-ink p-6 text-white">
          <h2 className="text-xl font-bold">Want the full programme?</h2>
          <p className="mt-2 text-sm text-white/60">
            The complete scope, release roadmap and tool audit live in the project
            documentation.
          </p>
          <Link href="/supported" className="btn-secondary mt-5 border-white/20 bg-transparent text-white hover:bg-white/10">
            See supported businesses
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
