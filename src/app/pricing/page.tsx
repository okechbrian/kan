import Link from "next/link";
import { PricingMatrix } from "../../components/site/PricingMatrix";
import { SharedBottomFunnel } from "../../components/site/SharedBottomFunnel";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";
import { StatusBadge } from "../../components/site/StatusBadge";

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="max-w-3xl">
            <p className="eyebrow">Pricing</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
              Transparent plans in Ugandan shillings.
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusBadge state="now" />
              <p className="text-sm text-navy/70">
                Offline counter till works free locally today. Cloud workspace
                subscriptions scale from Basic to Enterprise in integer UGX.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <PricingMatrix />
          </div>

          <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy">Your data stays yours</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy/70">
              Export your complete shop books as JSON anytime. Upgrading or switching
              billing cycles never locks you out of your counter till.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/pos" className="btn-primary text-sm">
                Open your till
              </Link>
              <Link href="/features" className="btn-secondary text-sm">
                Compare features
              </Link>
            </div>
          </div>
        </section>
        <SharedBottomFunnel showPricing={false} />
      </main>
      <SiteFooter />
    </>
  );
}
