import Link from "next/link";
import {
  Barcode,
  ClipboardCheck,
  MessageSquareHeart,
  Receipt,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";
import { FeatureCard } from "../../components/site/FeatureCard";
import { SharedBottomFunnel } from "../../components/site/SharedBottomFunnel";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";

const CAPABILITIES = [
  {
    icon: <ClipboardCheck className="h-5 w-5" />,
    title: "Order & credit (deni) management",
    description:
      "Allow trusted customers to buy on credit, raise pay-later invoices with clear balances and collect partial or full payments.",
    state: "now" as const,
  },
  {
    icon: <Barcode className="h-5 w-5" />,
    title: "Seamless sales checkout",
    description:
      "Ring up sales by fast-mover tiles, product name, barcode or QR code. Print thermal receipts or share digital receipts.",
    state: "now" as const,
  },
  {
    icon: <UserCheck className="h-5 w-5" />,
    title: "Sales team management",
    description:
      "Assign attendant PINs, separate owner vs cashier actions (voids, adjustments, draws) and track sales per staff member.",
    state: "now" as const,
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Customer register",
    description:
      "Keep a phone-first register per shop so balances, purchase history and follow-ups stay accurate.",
    state: "now" as const,
  },
  {
    icon: <MessageSquareHeart className="h-5 w-5" />,
    title: "Customer reviews",
    description:
      "Collect product feedback from storefront orders and moderate reviews before publishing.",
    state: "soon" as const,
  },
  {
    icon: <Truck className="h-5 w-5" />,
    title: "Delivery tracking",
    description:
      "Offer boda or pickup delivery bands with clear UGX fees, order status steps and dispute notes.",
    state: "soon" as const,
  },
];

export default function ManageSalesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="max-w-3xl">
            <p className="eyebrow">Sales management & POS</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
              A POS system you can trust at the counter.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-navy/75">
              Keep the queue moving even when mobile data drops. Every sale updates stock,
              customer credit (deni) and your shift cash drawer in one integer-UGX ledger.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pos" className="btn-primary">
                Open your till
              </Link>
              <Link href="/app/signup" className="btn-secondary">
                Create workspace
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-navy/10 bg-teal-soft p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Receipt className="mt-1 h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-bold text-navy">
                    Clean end-of-day cash close
                  </h2>
                  <p className="mt-1 text-sm text-navy/75">
                    Expected cash equals opening float + cash sales + cash deni
                    collections − owner draws − cash expenses.
                  </p>
                </div>
              </div>
              <Link href="/pos" className="btn-primary text-sm">
                Try the till
              </Link>
            </div>
          </div>
        </section>
        <SharedBottomFunnel />
      </main>
      <SiteFooter />
    </>
  );
}
