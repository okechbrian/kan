import Link from "next/link";
import { Building2 } from "lucide-react";
import { SharedBottomFunnel } from "../../components/site/SharedBottomFunnel";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";
import { StatusBadge } from "../../components/site/StatusBadge";
import { VERTICALS } from "../../lib/verticals/profiles";

export default function SupportedPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <p className="eyebrow">Supported businesses</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            Sixteen ways to trade. One offline till underneath.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-navy/70">
            The core till works today for any shop selling goods. Specialist workflow
            packs (expiry dispensing, recipes, tables, bookings, serial numbers) roll out
            across waves 1–3.
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERTICALS.map((business) => (
              <article
                id={business.id}
                key={business.id}
                className="card flex scroll-mt-24 flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-soft text-navy">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <StatusBadge state={business.state === "available" ? "now" : "soon"} />
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-navy">{business.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-navy/70">
                    {business.summary}
                  </p>
                </div>
                <div className="mt-5 border-t border-navy/10 pt-3">
                  <Link
                    href={`/app/signup?vertical=${business.id}`}
                    className="btn-secondary w-full text-xs"
                  >
                    Create shop
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
        <SharedBottomFunnel />
      </main>
      <SiteFooter />
    </>
  );
}
