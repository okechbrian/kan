import Link from "next/link";
import {
  BarChart3,
  Bot,
  CalendarCheck,
  Clock,
  CreditCard,
  Globe,
  Landmark,
  MonitorSmartphone,
  Package,
  ShoppingBag,
  Store,
  Users,
  Warehouse,
} from "lucide-react";
import { FeatureCard } from "../../components/site/FeatureCard";
import { SharedBottomFunnel } from "../../components/site/SharedBottomFunnel";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";

const GROUPS = [
  {
    title: "Running the shop today",
    items: [
      {
        icon: <ShoppingBag className="h-5 w-5" />,
        title: "Point of sale",
        description:
          "Fast counter sales with cash, MTN and Airtel money, split payments and deni. Works offline.",
        state: "now" as const,
        href: "/manage-sales",
      },
      {
        icon: <Package className="h-5 w-5" />,
        title: "Inventory & batches",
        description:
          "Stock movements, receiving, adjustments, FIFO batches, expiry tracking and low-stock alerts.",
        state: "now" as const,
        href: "/manage-inventory",
      },
      {
        icon: <Users className="h-5 w-5" />,
        title: "Customers and credit",
        description:
          "Phone-first customer records, running deni balance and collections, scoped per shop.",
        state: "now" as const,
        href: "/manage-sales",
      },
      {
        icon: <Clock className="h-5 w-5" />,
        title: "Close the till",
        description:
          "Expected cash against counted cash, variance, MoMo totals and a clean end of shift.",
        state: "now" as const,
        href: "/pos",
      },
      {
        icon: <Store className="h-5 w-5" />,
        title: "Shops and staff",
        description:
          "One owner, many shops; attendants bound to one shop with PIN access.",
        state: "now" as const,
        href: "/app/shops",
      },
      {
        icon: <BarChart3 className="h-5 w-5" />,
        title: "Analytics & alerts",
        description:
          "Sales, payment tenders, profit estimates, low-stock and close-to-expiry alerts.",
        state: "now" as const,
        href: "/business-analytics",
      },
    ],
  },
  {
    title: "Growing online and with partners",
    items: [
      {
        icon: <CreditCard className="h-5 w-5" />,
        title: "Payments & gateways",
        description:
          "Manual MoMo, cash and split pay work today. Card and collection APIs connect through licensed Ugandan gateways.",
        state: "soon" as const,
        href: "/payment",
      },
      {
        icon: <Globe className="h-5 w-5" />,
        title: "Online store",
        description:
          "Shareable storefront preview synced with stock; real buyer checkout completes once cloud sync is enabled.",
        state: "soon" as const,
        href: "/onlineshop",
      },
      {
        icon: <Warehouse className="h-5 w-5" />,
        title: "Warehouse & supply chain",
        description:
          "Transfers between shops, suppliers, purchase orders and production batches.",
        state: "soon" as const,
        href: "/manage-inventory",
      },
      {
        icon: <CalendarCheck className="h-5 w-5" />,
        title: "Bookings & services",
        description:
          "Appointments, staff schedules and deposits for salons, spas and laundries.",
        state: "soon" as const,
        href: "/supported",
      },
      {
        icon: <MonitorSmartphone className="h-5 w-5" />,
        title: "Mobile & desktop apps",
        description:
          "Installable PWA today; Android, iOS and Windows desktop installers are on the roadmap.",
        state: "soon" as const,
        href: "/download",
      },
      {
        icon: <Bot className="h-5 w-5" />,
        title: "AI assistant",
        description:
          "Natural-language questions about your own business data, with strict isolation and guardrails.",
        state: "partner" as const,
        href: "/app/ai",
      },
      {
        icon: <Landmark className="h-5 w-5" />,
        title: "Business banking",
        description:
          "Balances, transfers and settlements through a licensed partner — never simulated here.",
        state: "partner" as const,
        href: "/app/banking",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <p className="eyebrow">Features</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            What Kan does — and what is still on the way.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-navy/70">
            Every capability is labelled honestly. Available now means built and
            verified. Coming soon means on the roadmap. With partner means it needs a
            licensed provider.
          </p>
          <div className="mt-10 space-y-12">
            {GROUPS.map((group) => (
              <section key={group.title}>
                <h2 className="text-2xl font-bold tracking-tight text-navy">
                  {group.title}
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <div key={item.title} className="flex flex-col">
                      <FeatureCard
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                        state={item.state}
                      />
                      <Link
                        href={item.href}
                        className="mt-2 inline-flex min-h-10 items-center px-2 text-xs font-bold text-navy hover:underline"
                      >
                        Explore module →
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
        <SharedBottomFunnel />
      </main>
      <SiteFooter />
    </>
  );
}
