import Link from "next/link";
import { Banknote, CreditCard, Landmark, ShieldAlert, Smartphone, Split } from "lucide-react";
import { FeatureCard } from "../../components/site/FeatureCard";
import { SharedBottomFunnel } from "../../components/site/SharedBottomFunnel";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";

const METHODS = [
  {
    icon: <Banknote className="h-5 w-5" />,
    title: "Cash payment (UGX)",
    description:
      "Record cash received and automatic change calculation in integer UGX. Expected cash is tracked per shift.",
    state: "now" as const,
  },
  {
    icon: <Smartphone className="h-5 w-5" />,
    title: "MTN MoMo & Airtel Money",
    description:
      "Display your merchant MoMo number at checkout with explicit confirmation today; automated collection APIs connect later.",
    state: "now" as const,
  },
  {
    icon: <Split className="h-5 w-5" />,
    title: "Split payment",
    description:
      "Accept part cash, part mobile money or part credit (deni) on a single sale. Tenders must sum strictly to the sale total.",
    state: "now" as const,
  },
  {
    icon: <Landmark className="h-5 w-5" />,
    title: "Bank transfer",
    description:
      "Record bank transfer references alongside your sales breakdown for clean end-of-day reconciliation.",
    state: "soon" as const,
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: "Card payments",
    description:
      "Accept card payments through licensed Ugandan gateways (such as Flutterwave) without Kan ever storing card details.",
    state: "partner" as const,
  },
  {
    icon: <ShieldAlert className="h-5 w-5" />,
    title: "Business wallet & crypto",
    description:
      "Any wallet settlement or digital asset rail is strictly partner-only with licensed providers and never simulated.",
    state: "partner" as const,
  },
];

export default function PaymentPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="max-w-3xl">
            <p className="eyebrow">Payments & reconciliation</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
              Accept cash, mobile money, split pay and credit in one ledger.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-navy/75">
              Every payment method reconciles back to your shift totals in integer UGX.
              Credit (deni) sales require a customer record so nothing is forgotten.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/more/payments" className="btn-primary">
                View payment reconciliation
              </Link>
              <Link href="/pos" className="btn-secondary">
                Open till
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METHODS.map((item) => (
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
