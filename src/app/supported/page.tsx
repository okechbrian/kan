import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";
import { StatusBadge } from "../../components/site/StatusBadge";

const BUSINESSES = [
  { name: "Groceries", note: "Fast movers, deni and daily close.", state: "now" as const },
  { name: "Kiosks", note: "Sell from one counter, reach buyers online later.", state: "now" as const },
  { name: "Food shops", note: "Stock, sales and credit in one book.", state: "now" as const },
  { name: "Bars", note: "Track stock and takings; tabs come with service commerce.", state: "soon" as const },
  { name: "SMEs", note: "One owner, many branches, one set of books.", state: "now" as const },
  { name: "Pharmaceutical shops", note: "Needs batch and expiry tracking before it can be trusted.", state: "soon" as const },
  { name: "Bakeries", note: "Production batches and daily fresh stock.", state: "soon" as const },
  { name: "Restaurants", note: "Menus, tables and online orders.", state: "soon" as const },
  { name: "Superstores", note: "Barcode scanning and high-volume checkout.", state: "soon" as const },
  { name: "Fashion shops", note: "Measurements, made-to-order jobs and fittings.", state: "soon" as const },
  { name: "Agro-based products", note: "Produce units and seasonal buying.", state: "soon" as const },
  { name: "Electrical & electronics", note: "Serial numbers and warranty records.", state: "soon" as const },
  { name: "Furniture shops", note: "Large items, delivery and deposits.", state: "soon" as const },
  { name: "Spas and salons", note: "Bookings, staff schedules and services.", state: "soon" as const },
  { name: "Factories", note: "Recipes, BOM and production runs.", state: "soon" as const },
  { name: "Laundries", note: "Order tracking from drop-off to collection.", state: "soon" as const },
];

export default function SupportedPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <p className="eyebrow">Supported businesses</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Sixteen ways to trade. One till underneath.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/60">
          The core till works for any shop that sells goods. Specialist packs add the
          workflows a particular trade needs, and are only marked available once built.
        </p>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESSES.map((business) => (
            <article key={business.name} className="card">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold">{business.name}</h2>
                <StatusBadge state={business.state} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{business.note}</p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
