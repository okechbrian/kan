"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { label: "Dashboard", href: "/app/dashboard", icon: "◷" },
  { label: "Products", href: "/app/products", icon: "▤" },
  { label: "Orders", href: "/app/orders", icon: "◈" },
  { label: "Online store", href: "/app/store", icon: "◍" },
  { label: "Channels", href: "/app/channels", icon: "◇" },
  { label: "Customers", href: "/app/customers", icon: "◉" },
  { label: "Reports", href: "/app/reports", icon: "◫" },
  { label: "Alerts", href: "/app/alerts", icon: "!" },
  { label: "Shops", href: "/app/shops", icon: "▣" },
  { label: "Staff", href: "/app/staff", icon: "♙" },
  { label: "Billing", href: "/app/billing", icon: "◇" },
  { label: "Settings", href: "/app/settings", icon: "⚙" },
];

export function DashboardChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-black/5 bg-white px-3 py-5 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-kan text-lg font-black text-white">
            K
          </span>
          <span className="text-lg font-extrabold text-ink">Kan</span>
        </Link>
        <nav className="flex-1 space-y-1" aria-label="Dashboard navigation">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-kan-soft text-kan-dark"
                    : "text-ink/60 hover:bg-black/5 hover:text-ink"
                }`}
              >
                <span aria-hidden="true" className="text-base">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-xl bg-cream p-3 text-xs leading-relaxed text-ink/50">
          Accounts open with the platform release. For now, use the till.
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href="/app/sign-in" className="btn-secondary justify-center px-2 py-2 text-xs">
            Sign in
          </Link>
          <Link href="/app/signup" className="btn-secondary justify-center px-2 py-2 text-xs">
            Create workspace
          </Link>
        </div>
        <Link href="/pos" className="btn-secondary mt-2 justify-center text-sm">
          Open your till
        </Link>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-cream/95 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-kan text-sm font-black text-white">
                K
              </span>
              <span className="font-extrabold text-ink">Kan</span>
            </Link>
            <Link href="/pos" className="btn-primary px-3 py-2 text-sm">
              Open till
            </Link>
          </div>
          <nav
            className="flex gap-1 overflow-x-auto px-3 pb-2"
            aria-label="Dashboard navigation"
          >
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${
                    active ? "bg-kan text-white" : "bg-white text-ink/60"
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
