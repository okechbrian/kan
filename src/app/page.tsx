import Link from "next/link";
import { FeatureCard } from "../components/site/FeatureCard";
import { HeroPreview } from "../components/site/HeroPreview";
import { SiteFooter } from "../components/site/SiteFooter";
import { SiteHeader } from "../components/site/SiteHeader";
import { StatusBadge } from "../components/site/StatusBadge";

const PILLARS = [
  {
    icon: "▣",
    title: "Point of sale",
    description:
      "Big buttons, fast moves, cash and mobile money. A sale finishes even when the network does not.",
    state: "now" as const,
  },
  {
    icon: "▤",
    title: "Inventory",
    description:
      "Stock drops when you sell. Receive goods, adjust counts and see what is running low.",
    state: "now" as const,
  },
  {
    icon: "◉",
    title: "Credit and customers",
    description:
      "Record deni, collect payments and see who owes the shop — per shop, never mixed.",
    state: "now" as const,
  },
  {
    icon: "◇",
    title: "Payments",
    description:
      "Split payments and digital channels will connect to the same sale record.",
    state: "soon" as const,
  },
  {
    icon: "◍",
    title: "Online store",
    description:
      "A shareable storefront that stays in sync with your stock, so one book runs both.",
    state: "soon" as const,
  },
  {
    icon: "◫",
    title: "Analytics",
    description:
      "Clear sales, stock and profit views to answer what to restock and where the money went.",
    state: "soon" as const,
  },
];

const FAQ = [
  {
    q: "What is Kan?",
    a: "Kan is a platform for Ugandan shops. The till, stock and credit book are already built. Storefronts, digital payments and analytics are being added in stages.",
  },
  {
    q: "Does the till need the internet?",
    a: "No. You can sell offline. When the network returns, the sale syncs — a failed connection never blocks a charge.",
  },
  {
    q: "Do attendants need an email address?",
    a: "No. Attendants unlock the till with a PIN.",
  },
  {
    q: "Is there a free trial?",
    a: "Trial terms will be published with the platform release. The till itself works without a subscription today.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Cancellation terms will be published with billing. Your records stay exportable as a JSON backup.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section pb-10 pt-12 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Built for Ugandan shops</p>
              <h1 className="mt-4 text-4xl font-black leading-[1.08] tracking-tight text-ink sm:text-6xl">
                Your shop,
                <br />
                <span className="text-kan">in one place.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/65 sm:text-lg">
                Sell at the counter with no internet. Keep stock and deni straight. Close
                the day knowing the till matches. Kan grows with you, from one duuka to
                many shops and an online store.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/pos" className="btn-primary">
                  Open your till
                </Link>
                <Link href="/features" className="btn-secondary">
                  See what is ready
                </Link>
              </div>
              <p className="mt-4 text-xs text-ink/45">
                No invented customer counts or testimonials on this site. Feature states
                are shown honestly.
              </p>
            </div>
            <HeroPreview />
          </div>
        </section>

        <section className="section border-t border-black/5 pt-12">
          <p className="eyebrow">The essentials</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            The counter first. Everything else follows.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <FeatureCard key={pillar.title} {...pillar} />
            ))}
          </div>
        </section>

        <section className="border-y border-black/5 bg-ink text-white">
          <div className="section">
            <p className="eyebrow text-white/60">One platform</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              One book for the counter, the store and the money.
            </h2>
            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Warehouse and transfers",
                "Booking and service commerce",
                "Staff roles and permissions",
                "Loyalty and rewards",
                "Expense tracking",
                "Discover merchants",
              ].map((item) => (
                <div
                  key={item}
                  className="flex min-h-11 items-center gap-3 rounded-xl bg-white/5 px-4 py-3"
                >
                  <span className="text-kan-soft" aria-hidden="true">
                    ◆
                  </span>
                  {item}
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-white/40">
                    Planned
                  </span>
                </div>
              ))}
            </div>
            <Link href="/features" className="btn-secondary mt-8 border-white/20 bg-transparent text-white hover:bg-white/10">
              Read the full feature list
            </Link>
          </div>
        </section>

        <section className="section">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Supported businesses</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Built around how shops actually work.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink/60">
                Groceries, pharmacies, restaurants, salons, farms, factories and more.
                Each gets its own workflows — but the same offline till underneath.
              </p>
              <Link href="/supported" className="btn-secondary mt-6">
                See all 16 businesses
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "Groceries",
                "Pharmacy",
                "Restaurants",
                "Superstores",
                "Bakeries",
                "Fashion",
                "Kiosks",
                "Agro",
                "Electrical",
                "Furniture",
                "Bars",
                "Spas & salons",
                "Factories",
                "Laundries",
                "SMEs",
              ].map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-semibold text-ink/60"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section border-t border-black/5">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Pricing</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Plans that grow with the shop.
              </h2>
              <p className="mt-3 text-sm text-ink/60">
                Indicative UGX prices only — final prices to be confirmed.
              </p>
            </div>
            <Link href="/pricing" className="btn-primary">
              See the plans
            </Link>
          </div>
        </section>

        <section className="section border-t border-black/5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="eyebrow">Get the apps</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight">
                Android, iOS and Windows are on the roadmap.
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Android app", "iOS app", "Windows desktop"].map((label) => (
                <span key={label} className="card flex items-center gap-2 px-4 py-3 text-sm">
                  {label}
                  <StatusBadge state="soon" />
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section border-t border-black/5">
          <h2 className="text-2xl font-black tracking-tight">Frequently asked questions</h2>
          <div className="mt-6 grid gap-3">
            {FAQ.map((item) => (
              <details key={item.q} className="card group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink marker:hidden">
                  {item.q}
                  <span aria-hidden="true" className="text-kan">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
