"use client";

import { useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, ShoppingBag, Store } from "lucide-react";
import { KanLogo } from "../brand/KanLogo";

const DEMO_BARS = [
  { day: "Mon", pct: 48, amount: "UGX 195,000" },
  { day: "Tue", pct: 62, amount: "UGX 254,000" },
  { day: "Wed", pct: 55, amount: "UGX 220,000" },
  { day: "Thu", pct: 74, amount: "UGX 298,000" },
  { day: "Fri", pct: 86, amount: "UGX 345,000" },
  { day: "Sat", pct: 95, amount: "UGX 382,000" },
  { day: "Sun", pct: 38, amount: "UGX 151,000" },
];

export function HeroPreview() {
  const [view, setView] = useState<"overview" | "till">("overview");

  return (
    <div className="rounded-3xl border border-navy/10 bg-white p-4 shadow-2xl shadow-navy/10 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy/10 pb-3">
        <div className="flex items-center gap-2.5">
          <KanLogo variant="navy" className="h-5 w-auto min-w-[80px]" />
          <span className="rounded-full bg-guava-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
            Demo
          </span>
        </div>
        <div className="flex gap-1 rounded-xl bg-softwhite p-1">
          <button
            type="button"
            onClick={() => setView("overview")}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              view === "overview" ? "bg-navy text-softwhite" : "text-navy/65 hover:text-navy"
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setView("till")}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              view === "till" ? "bg-navy text-softwhite" : "text-navy/65 hover:text-navy"
            }`}
          >
            Counter till
          </button>
        </div>
      </div>

      {view === "overview" ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-navy/10 bg-softwhite p-3">
              <p className="text-[11px] font-bold uppercase text-navy/55">Revenue (7d)</p>
              <p className="ugx-amount mt-1 text-sm font-bold text-navy sm:text-base">
                UGX 1,845,000
              </p>
              <span className="mt-1 inline-block rounded-full bg-teal-soft px-1.5 py-0.5 text-[10px] font-bold text-navy">
                Demo data
              </span>
            </div>
            <div className="rounded-xl border border-navy/10 bg-softwhite p-3">
              <p className="text-[11px] font-bold uppercase text-navy/55">Sales</p>
              <p className="ugx-amount mt-1 text-sm font-bold text-navy sm:text-base">64</p>
              <span className="mt-1 inline-block text-[10px] font-semibold text-navy/60">
                Cash & MoMo
              </span>
            </div>
            <div className="rounded-xl border border-navy/10 bg-softwhite p-3">
              <p className="text-[11px] font-bold uppercase text-navy/55">Avg basket</p>
              <p className="ugx-amount mt-1 text-sm font-bold text-navy sm:text-base">
                UGX 28,828
              </p>
              <span className="mt-1 inline-block text-[10px] font-semibold text-navy/60">
                All branches
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-navy/10 bg-softwhite p-3">
            <div className="flex items-center justify-between text-xs font-bold text-navy">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                Daily sales (Demo · Kampala shop)
              </span>
              <span className="text-navy/55">Mon – Sun</span>
            </div>
            <div className="mt-3 grid grid-cols-7 items-end gap-2">
              {DEMO_BARS.map((bar) => (
                <div key={bar.day} className="flex flex-col items-center gap-1" title={bar.amount}>
                  <div className="flex h-16 w-full items-end rounded-md bg-navy/5 p-0.5">
                    <div
                      className="w-full rounded-sm bg-navy"
                      style={{ height: `${bar.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-navy/60">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-guava/40 bg-guava-soft p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Stock alerts (Demo)
              </div>
              <p className="mt-1 text-xs font-semibold text-navy">Sugar 1kg · 4 left</p>
              <p className="text-[11px] text-navy/70">Cooking oil 1L · 3 left</p>
            </div>
            <div className="rounded-xl border border-teal/40 bg-teal-soft p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Channels (Demo)
              </div>
              <p className="mt-1 text-xs font-semibold text-navy">Counter till · Ready</p>
              <p className="text-[11px] text-navy/70">Online storefront · Preview</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-navy/10 bg-softwhite p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-navy">
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                Active Cart (Demo)
              </span>
              <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-bold text-navy">
                Offline ready
              </span>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-navy">
                <span>Sugar 1kg × 2</span>
                <span className="ugx-amount font-bold">UGX 10,000</span>
              </div>
              <div className="flex justify-between text-navy">
                <span>Bar soap × 1</span>
                <span className="ugx-amount font-bold">UGX 3,500</span>
              </div>
              <div className="flex justify-between border-t border-navy/10 pt-2 text-sm font-bold text-navy">
                <span>Total due</span>
                <span className="ugx-amount">UGX 13,500</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-navy px-4 py-3 text-xs text-softwhite">
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="h-4 w-4 text-teal" aria-hidden="true" />
              Cash · MTN MoMo · Airtel · Credit (deni)
            </span>
            <span className="rounded-full bg-teal px-2.5 py-0.5 font-bold text-navy">
              Available now
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
