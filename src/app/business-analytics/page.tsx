import Link from "next/link";
import { BarChart3, LineChart, PieChart, TrendingUp } from "lucide-react";
import { FeatureCard } from "../../components/site/FeatureCard";
import { SharedBottomFunnel } from "../../components/site/SharedBottomFunnel";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";

const REPORTS = [
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Product performance",
    description:
      "Track fast movers and slow items across hours, days, weeks and months so restocking matches demand.",
    state: "now" as const,
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Sales report",
    description:
      "Break down quantities, gross totals and payment methods (cash, MTN MoMo, Airtel Money, credit) by shift or period.",
    state: "now" as const,
  },
  {
    icon: <LineChart className="h-5 w-5" />,
    title: "Expenses tracking",
    description:
      "Monitor daily operating costs, owner draws and supplier outlays against shop takings.",
    state: "now" as const,
  },
  {
    icon: <PieChart className="h-5 w-5" />,
    title: "Profit margin per product",
    description:
      "Compare buying price snapshots against selling price to see real gross margin in integer UGX.",
    state: "now" as const,
  },
];

export default function BusinessAnalyticsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="max-w-3xl">
            <p className="eyebrow">Business analytics</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
              Analyse your shop performance with clear figures.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-navy/75">
              Every figure comes directly from your shop ledger in tabular integer UGX —
              no guesswork when checking margins, deni or branch totals.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app/reports" className="btn-primary">
                Open local reports
              </Link>
              <Link href="/app/alerts" className="btn-secondary">
                View stock alerts
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {REPORTS.map((item) => (
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
