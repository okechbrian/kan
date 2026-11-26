"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookmarkCheck,
  Building2,
  CalendarCheck,
  CreditCard,
  Factory,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Truck,
  Users,
  UserCheck,
  Wallet,
  Warehouse,
} from "lucide-react";
import { KanLogo } from "../brand/KanLogo";

const NAV = [
  { label: "Dashboard", href: "/app/dashboard", Icon: LayoutDashboard },
  { label: "Products", href: "/app/products", Icon: Package },
  { label: "Orders", href: "/app/orders", Icon: ShoppingBag },
  { label: "Reserved orders", href: "/app/reserved-orders", Icon: BookmarkCheck },
  { label: "Customers", href: "/app/customers", Icon: Users },
  { label: "Payments", href: "/app/payments", Icon: CreditCard },
  { label: "Bookings", href: "/app/bookings", Icon: CalendarCheck },
  { label: "Expenses", href: "/app/expenses", Icon: Receipt },
  { label: "Purchases", href: "/app/purchases", Icon: Truck },
  { label: "Production", href: "/app/production", Icon: Factory },
  { label: "Warehouse", href: "/app/warehouse", Icon: Warehouse },
  { label: "Online store", href: "/app/store", Icon: Store },
  { label: "Channels", href: "/app/channels", Icon: Share2 },
  { label: "Reports", href: "/app/reports", Icon: BarChart3 },
  { label: "Notifications", href: "/app/notifications", Icon: Bell },
  { label: "Alerts", href: "/app/alerts", Icon: AlertTriangle },
  { label: "Shops", href: "/app/business/branch", Icon: Building2 },
  { label: "Staff", href: "/app/staff", Icon: UserCheck },
  { label: "AI assistant", href: "/app/assistant", Icon: Sparkles },
  { label: "Wallet", href: "/app/wallet", Icon: Wallet },
  { label: "Billing", href: "/app/billing", Icon: CreditCard },
  { label: "Settings", href: "/app/settings", Icon: Settings },
  { label: "Business type", href: "/app/verticals", Icon: Tag },
];

export function DashboardChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-softwhite">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-navy/10 bg-navy px-3 py-5 text-softwhite lg:flex">
        <Link href="/" className="mb-6 flex items-center px-2" aria-label="Kan home">
          <KanLogo variant="primary" className="h-8 w-auto min-w-[80px]" />
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Dashboard navigation">
          {NAV.map(({ label, href, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition ${
                  active
                    ? "bg-teal text-navy"
                    : "text-softwhite/75 hover:bg-white/10 hover:text-softwhite"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/app/sign-in"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-2 py-2 text-center text-xs font-bold text-softwhite transition hover:bg-white/10"
          >
            Sign in
          </Link>
          <Link
            href="/app/signup"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-2 py-2 text-center text-xs font-bold text-softwhite transition hover:bg-white/10"
          >
            Create workspace
          </Link>
        </div>
        <Link href="/pos" className="btn-primary-dark mt-2 justify-center text-sm">
          Open your till
        </Link>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-navy/10 bg-navy text-softwhite lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" className="flex items-center" aria-label="Kan home">
              <KanLogo variant="primary" className="h-7 w-auto min-w-[80px]" />
            </Link>
            <Link href="/pos" className="btn-primary-dark px-3 py-2 text-sm">
              Open till
            </Link>
          </div>
          <nav
            className="flex gap-1 overflow-x-auto px-3 pb-2"
            aria-label="Dashboard navigation"
          >
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${
                    active ? "bg-teal text-navy" : "bg-white/10 text-softwhite/80"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
