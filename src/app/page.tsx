import Link from "next/link";
import {
  BarChart3,
  Bot,
  Building2,
  CalendarCheck,
  Compass,
  CreditCard,
  Globe,
  HardDrive,
  HeartHandshake,
  Landmark,
  MonitorSmartphone,
  Package,
  Receipt,
  Share2,
  ShoppingBag,
  Store,
  Truck,
  UserCheck,
  WalletCards,
  Warehouse,
} from "lucide-react";
import { FeatureCard } from "../components/site/FeatureCard";
import { HeroPreview } from "../components/site/HeroPreview";
import { SharedBottomFunnel } from "../components/site/SharedBottomFunnel";
import { SiteFooter } from "../components/site/SiteFooter";
import { SiteHeader } from "../components/site/SiteHeader";
import { StatusBadge } from "../components/site/StatusBadge";
import { ugx } from "../lib/money";
import { KAN_HARDWARE_DEVICES } from "../lib/platform/pricing";

const MODULE_STRIP = [
  "Booking & Service Commerce",
  "Expenses",
  "Analytics",
  "Checkout & Payment",
  "Warehouse",
  "Inventory",
  "Social Store",
  "Discover Merchants",
  "Online Store",
  "POS Machines",
  "Point of Sale",
  "Loyalty & Rewards",
  "Multi-staff Support",
];

const CORE_MODULES = [
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Online Store",
    description:
      "Publish a shareable shop link synced directly with your stock. Out-of-stock and expired items stay hidden.",
    state: "soon" as const,
    href: "/onlineshop",
  },
  {
    icon: <Package className="h-5 w-5" />,
    title: "Inventory",
    description:
      "Track stock by unit, kg, litre or metre, record batches and expiry dates, and review low-stock alerts.",
    state: "now" as const,
    href: "/manage-inventory",
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    title: "Point of Sale",
    description:
      "Sell at the counter offline with big product tiles, cash, MTN/Airtel MoMo, split pay and customer credit (deni).",
    state: "now" as const,
    href: "/manage-sales",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Analytics",
    description:
      "Turn counter sales, payment tenders, expenses and margins into clear daily and shift reports.",
    state: "now" as const,
    href: "/business-analytics",
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: "Social Store",
    description:
      "Share products straight to WhatsApp and social channels with integer UGX pricing and direct order links.",
    state: "now" as const,
    href: "/onlineshop",
  },
  {
    icon: <Store className="h-5 w-5" />,
    title: "Marketplace Connector",
    description:
      "Sync one product edit across your counter catalogue, online storefront and channel listings.",
    state: "soon" as const,
    href: "/app/channels",
  },
];

const ONE_VIEW_MODULES = [
  {
    icon: <Warehouse className="h-5 w-5" />,
    title: "Warehouse",
    description: "Manage stock across branches and warehouses with recorded transfers and restock queues.",
    state: "now" as const,
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    title: "Booking & Service Commerce",
    description: "Appointments, staff schedules and service tickets for salons, spas and laundries.",
    state: "soon" as const,
  },
  {
    icon: <UserCheck className="h-5 w-5" />,
    title: "Staff Management",
    description: "PIN access for counter attendants, owner-only voids and role-based permissions.",
    state: "now" as const,
  },
  {
    icon: <HeartHandshake className="h-5 w-5" />,
    title: "Loyalty & Rewards",
    description: "Phone-first customer register, purchase history, deni ledger and returning-buyer rewards.",
    state: "soon" as const,
  },
  {
    icon: <Receipt className="h-5 w-5" />,
    title: "Expenses",
    description: "Record shop rent, transport, fuel and cash draws so daily cash close stays exact.",
    state: "now" as const,
  },
  {
    icon: <WalletCards className="h-5 w-5" />,
    title: "Checkout & Payments",
    description: "Cash, MTN MoMo, Airtel Money, credit (deni) and split payments reconciled per shift.",
    state: "now" as const,
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section pb-12 pt-10 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white px-3 py-1.5 text-xs font-bold text-navy shadow-sm">
                <span className="h-2 w-2 rounded-full bg-guava" aria-hidden="true" />
                Built for Ugandan shops · Pwata Inc
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-6xl">
                Your shop,
                <br />
                in one place.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-navy/75 sm:text-lg">
                Sell at the counter even when the network drops. Keep stock, mobile money
                and customer credit (deni) straight, and expand into an online store as
                your shop grows.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/pos" className="btn-primary">
                  Open your till
                </Link>
                <Link href="/app/signup" className="btn-secondary">
                  Get started
                </Link>
                <Link href="/discover" className="btn-quiet">
                  Shop merchants
                </Link>
              </div>
              <p className="mt-4 text-xs text-navy/60">
                Kan is a product of Pwata Inc. Preview panels are clearly labelled Demo;
                all currency values are integer UGX.
              </p>
            </div>
            <div className="lg:col-span-6">
              <HeroPreview />
            </div>
          </div>
        </section>

        <section className="border-y border-navy/10 bg-white py-5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 sm:px-6">
            {MODULE_STRIP.map((item) => (
              <span
                key={item}
                className="rounded-full border border-navy/10 bg-softwhite px-3.5 py-1.5 text-xs font-bold text-navy/80"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="max-w-2xl">
            <p className="eyebrow">One platform. Your entire business.</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              Connect counter sales, inventory and online orders.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_MODULES.map((mod) => (
              <div key={mod.title} className="flex flex-col">
                <FeatureCard
                  icon={mod.icon}
                  title={mod.title}
                  description={mod.description}
                  state={mod.state}
                />
                <Link
                  href={mod.href}
                  className="mt-2 inline-flex min-h-10 items-center px-2 text-xs font-bold text-navy hover:underline"
                >
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-navy text-softwhite">
          <div className="section">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal">
                Sell. Operate. Then accelerate.
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                AI, banking and supply chain built on the same stock ledger.
              </h2>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-2">
                  <Bot className="h-6 w-6 text-teal" aria-hidden="true" />
                  <StatusBadge state="partner" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Kan AI Assistant</h3>
                <p className="mt-2 text-sm text-softwhite/75">
                  Ask plain questions about your own shop data and reports with strict
                  tenant isolation and human confirmation.
                </p>
                <Link href="/app/ai" className="btn-primary-dark mt-5 text-xs">
                  Learn more
                </Link>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-2">
                  <Landmark className="h-6 w-6 text-teal" aria-hidden="true" />
                  <StatusBadge state="partner" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Business Banking</h3>
                <p className="mt-2 text-sm text-softwhite/75">
                  Balances, transfers and payouts connected through licensed Uganda
                  financial partners — never simulated.
                </p>
                <Link href="/app/banking" className="btn-primary-dark mt-5 text-xs">
                  Learn more
                </Link>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-2">
                  <Truck className="h-6 w-6 text-teal" aria-hidden="true" />
                  <StatusBadge state="soon" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Supply Chain & Production</h3>
                <p className="mt-2 text-sm text-softwhite/75">
                  Manage suppliers, production batches, recipes and inbound stock across
                  branches.
                </p>
                <Link href="/manage-inventory" className="btn-primary-dark mt-5 text-xs">
                  Learn more
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">Point-of-Sale (POS) devices</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
                Built for faster counter checkout.
              </h2>
              <p className="mt-2 text-sm text-navy/70">
                Start with any Android phone today. Add a touchscreen register, 80mm
                thermal printer, barcode scanner or steel cash drawer as volume grows.
              </p>
            </div>
            <Link href="/devices" className="btn-secondary text-sm">
              Explore all devices
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KAN_HARDWARE_DEVICES.slice(0, 4).map((device) => (
              <article key={device.id} className="card flex flex-col justify-between">
                <div>
                  <HardDrive className="h-6 w-6 text-navy" aria-hidden="true" />
                  <h3 className="mt-3 text-base font-bold text-navy">{device.name}</h3>
                  <p className="mt-1.5 text-xs text-navy/65">{device.summary}</p>
                </div>
                <div className="mt-4 border-t border-navy/10 pt-3">
                  <p className="ugx-amount text-lg font-bold text-navy">
                    {ugx(device.priceUgx)}
                  </p>
                  <p className="text-[11px] text-navy/55">Indicative UGX price</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section border-t border-navy/10">
          <div className="max-w-2xl">
            <p className="eyebrow">One business. One view.</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              Every shop operation without disconnected spreadsheets.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ONE_VIEW_MODULES.map((item) => (
              <FeatureCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                state={item.state}
              />
            ))}
          </div>
        </section>

        <section className="section border-t border-navy/10">
          <div className="grid items-center gap-8 rounded-3xl border border-navy/10 bg-teal-soft p-7 lg:grid-cols-12 lg:p-10">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-navy">
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                Discover merchants
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy">
                Discover & shop from Ugandan businesses powered by Kan.
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-navy/75">
                Browse groceries, pharmacies, bakeries, restaurants, salons and hardware
                shops across Entebbe, Kampala and beyond.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <Link href="/discover" className="btn-primary">
                Explore merchants
              </Link>
              <Link href="/supported" className="btn-secondary">
                16 business types
              </Link>
            </div>
          </div>
        </section>

        <section className="section border-t border-navy/10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="eyebrow">Supported businesses</p>
              <h2 className="mt-2 text-2xl font-bold text-navy">
                Sixteen business verticals, one offline till underneath.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/supported" className="btn-secondary text-sm">
                See all 16 businesses
              </Link>
              <Link href="/download" className="btn-quiet text-sm">
                <MonitorSmartphone className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Apps & PWA
              </Link>
              <Link href="/app/billing" className="btn-quiet text-sm">
                <CreditCard className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Billing
              </Link>
              <Link href="/app/shops" className="btn-quiet text-sm">
                <Building2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Multi-shop
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
