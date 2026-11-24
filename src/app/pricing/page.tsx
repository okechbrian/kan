import Link from "next/link";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";
import { StatusBadge } from "../../components/site/StatusBadge";

const PLANS = [
  { name: "Basic", price: "30,000", staff: "2 staff", branches: "1 branch", skus: "500 products", store: "Basic storefront" },
  { name: "Growth", price: "60,000", staff: "3 staff", branches: "2 branches", skus: "1,000 products", store: "Customisable storefront" },
  { name: "Scale-Up", price: "120,000", staff: "5 staff", branches: "5 branches", skus: "2,000 products", store: "Bulk upload and customising" },
  { name: "Premium", price: "250,000", staff: "20 staff", branches: "8 branches", skus: "6,000 products", store: "Full e-commerce" },
  { name: "Enterprise", price: "Talk to us", staff: "Unlimited staff", branches: "Unlimited branches", skus: "Unlimited products", store: "Custom requirements" },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Plans for the next shop, not just this one.
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StatusBadge state="soon" />
          <p className="text-sm text-ink/60">
            All figures are indicative UGX monthly prices. Final prices and trial terms
            are published with the platform release.
          </p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article key={plan.name} className="card flex flex-col">
              <h2 className="text-xl font-black">{plan.name}</h2>
              <p className="mt-3 text-3xl font-black tracking-tight text-kan">
                {plan.price === "Talk to us" ? plan.price : `UGX ${plan.price}`}
              </p>
              {plan.price !== "Talk to us" ? (
                <p className="text-xs text-ink/40">per month · indicative</p>
              ) : null}
              <ul className="mt-5 space-y-2 text-sm text-ink/65">
                <li>{plan.staff}</li>
                <li>{plan.branches}</li>
                <li>{plan.skus}</li>
                <li>{plan.store}</li>
              </ul>
              <p className="mt-5 text-xs text-ink/40">
                Monthly · Quarterly · 6-month · Yearly
              </p>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-black/5 bg-white p-6">
          <h2 className="text-lg font-bold">The till today</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">
            The offline till is available now without a subscription. Billing starts with
            the platform release; your records remain exportable at any time.
          </p>
          <Link href="/features" className="btn-secondary mt-5">
            Compare features
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
