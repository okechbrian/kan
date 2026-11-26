import Link from "next/link";
import { Bell, FileText, Globe, PackageCheck, Share2, ShieldOff } from "lucide-react";
import { FeatureCard } from "../../components/site/FeatureCard";
import { SharedBottomFunnel } from "../../components/site/SharedBottomFunnel";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";

const HIGHLIGHTS = [
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Custom shop web address",
    description:
      "Every shop gets a shareable storefront link with no separate hosting fee, available to buyers 24/7.",
    state: "soon" as const,
  },
  {
    icon: <PackageCheck className="h-5 w-5" />,
    title: "Synced with live inventory",
    description:
      "Your online catalogue reads from your shop stock so counters and web orders share one source of truth.",
    state: "soon" as const,
  },
  {
    icon: <ShieldOff className="h-5 w-5" />,
    title: "Auto-hides expired & out-of-stock",
    description:
      "Expired batches and unavailable items are automatically filtered out of your customer storefront.",
    state: "soon" as const,
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: "WhatsApp & social sharing",
    description:
      "Generate ready-to-share product cards and links for WhatsApp status, Instagram and Facebook.",
    state: "soon" as const,
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "7 automatic shop alerts",
    description:
      "Low stock, close-to-expiry items, deni overdue balances, new orders, staff activity, top/slow movers and shift summaries.",
    state: "soon" as const,
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Digital receipts & creditor invoices",
    description:
      "Share clean black-ink printable or digital receipts and send invoices to deni customers for collection.",
    state: "soon" as const,
  },
];

export default function OnlineShopPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="max-w-3xl">
            <p className="eyebrow">Online shop & social store</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
              Let your phone become your online storefront.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-navy/75">
              Set up your shop catalogue once, sell at the physical counter offline, and
              preview your catalogue on this device. Public browsing and online ordering are coming soon.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop/demo-duuka" className="btn-primary">
                Preview demo storefront
              </Link>
              <Link href="/app/store" className="btn-secondary">
                Storefront settings
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
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
