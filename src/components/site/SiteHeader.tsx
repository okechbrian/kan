"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  ChevronDown,
  CreditCard,
  Globe,
  Landmark,
  Menu,
  MonitorSmartphone,
  Package,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { VERTICALS } from "../../lib/verticals/profiles";
import { KanLogo } from "../brand/KanLogo";

const FEATURE_LINKS = [
  { label: "Point of sale", href: "/manage-sales", desc: "Offline till, deni & receipts", Icon: ShoppingBag },
  { label: "Manage inventory", href: "/manage-inventory", desc: "Units, expiry, barcodes & sync", Icon: Package },
  { label: "Payments", href: "/payment", desc: "Cash, MTN/Airtel MoMo & split", Icon: CreditCard },
  { label: "Online shop", href: "/onlineshop", desc: "24/7 storefront synced to stock", Icon: Globe },
  { label: "Business analytics", href: "/business-analytics", desc: "Sales, expenses & profit margin", Icon: BarChart3 },
  { label: "POS devices", href: "/devices", desc: "Registers, printers & scanners", Icon: MonitorSmartphone },
  { label: "Business banking", href: "/app/banking", desc: "With licensed partners", Icon: Landmark },
  { label: "Discover merchants", href: "/discover", desc: "Browse Ugandan shops on Kan", Icon: Building2 },
  { label: "All features", href: "/features", desc: "Full platform roadmap & status", Icon: Sparkles },
];

export function Logo({ variant = "navy" }: { variant?: "primary" | "navy" | "black" }) {
  return (
    <Link href="/" className="inline-flex items-center" aria-label="Kan home">
      <KanLogo variant={variant} className="h-8 w-auto min-w-[80px]" />
    </Link>
  );
}

export function SiteHeader() {
  const [openMenu, setOpenMenu] = useState<"features" | "businesses" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-softwhite/95 backdrop-blur">
      <div
        ref={navRef}
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6"
      >
        <Logo variant="navy" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          <div className="relative">
            <button
              type="button"
              aria-expanded={openMenu === "features"}
              onClick={() => setOpenMenu((cur) => (cur === "features" ? null : "features"))}
              className="btn-quiet gap-1 text-sm font-semibold"
            >
              Features
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
            {openMenu === "features" ? (
              <div className="absolute left-0 top-14 z-50 grid w-[540px] grid-cols-2 gap-1 rounded-2xl border border-navy/10 bg-white p-3 shadow-2xl">
                {FEATURE_LINKS.map(({ label, href, desc, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpenMenu(null)}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-teal-soft"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-navy">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-navy">{label}</p>
                      <p className="text-xs text-navy/60">{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              aria-expanded={openMenu === "businesses"}
              onClick={() =>
                setOpenMenu((cur) => (cur === "businesses" ? null : "businesses"))
              }
              className="btn-quiet gap-1 text-sm font-semibold"
            >
              Supported businesses
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
            {openMenu === "businesses" ? (
              <div className="absolute left-0 top-14 z-50 w-[480px] rounded-2xl border border-navy/10 bg-white p-3 shadow-2xl">
                <div className="grid grid-cols-2 gap-1">
                  {VERTICALS.map((v) => (
                    <Link
                      key={v.id}
                      href={`/supported#${v.id}`}
                      onClick={() => setOpenMenu(null)}
                      className="flex min-h-10 items-center justify-between rounded-xl px-3 py-1.5 text-sm font-medium text-navy hover:bg-teal-soft"
                    >
                      <span>{v.name}</span>
                      <span className="text-[10px] font-bold uppercase text-navy/50">
                        {v.state === "available" ? "Now" : "Planned"}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="mt-2 border-t border-navy/10 pt-2">
                  <Link
                    href="/supported"
                    onClick={() => setOpenMenu(null)}
                    className="block rounded-xl px-3 py-2 text-center text-xs font-bold text-navy hover:bg-teal-soft"
                  >
                    View all 16 supported businesses →
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <Link href="/pricing" className="btn-quiet text-sm font-semibold">
            Pricing
          </Link>
          <Link href="/devices" className="btn-quiet text-sm font-semibold">
            POS Devices
          </Link>
          <Link href="/download" className="btn-quiet text-sm font-semibold">
            Download
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/app/sign-in" className="btn-quiet hidden text-sm font-semibold sm:inline-flex">
            Login
          </Link>
          <Link href="/app/signup" className="btn-secondary hidden px-3.5 py-2 text-sm md:inline-flex">
            Register
          </Link>
          <Link href="/pos" className="btn-primary px-3.5 py-2 text-sm">
            Open till
          </Link>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileOpen((cur) => !cur)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-navy/15 bg-white text-navy lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-navy/10 bg-white px-4 py-4 shadow-lg lg:hidden">
          <nav className="grid gap-1" aria-label="Mobile navigation">
            <Link
              href="/features"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-teal-soft"
            >
              Features
            </Link>
            <div className="grid grid-cols-2 gap-1 pl-3">
              {FEATURE_LINKS.slice(0, 6).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="min-h-10 rounded-lg px-2.5 py-2 text-xs font-medium text-navy/80 hover:bg-teal-soft"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              href="/supported"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-teal-soft"
            >
              Supported businesses (16)
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-teal-soft"
            >
              Pricing (UGX)
            </Link>
            <Link
              href="/devices"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-teal-soft"
            >
              POS Devices
            </Link>
            <Link
              href="/discover"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-teal-soft"
            >
              Discover merchants
            </Link>
            <Link
              href="/download"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-teal-soft"
            >
              Download
            </Link>
            <Link
              href="/help"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-teal-soft"
            >
              Help & Contact
            </Link>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-navy/10 pt-3">
              <Link
                href="/app/sign-in"
                onClick={() => setMobileOpen(false)}
                className="btn-secondary text-sm"
              >
                Login
              </Link>
              <Link
                href="/app/signup"
                onClick={() => setMobileOpen(false)}
                className="btn-primary text-sm"
              >
                Register
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
