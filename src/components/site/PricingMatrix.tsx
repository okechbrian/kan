"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { ugx } from "../../lib/money";
import { KAN_SUBSCRIPTION_PLANS, type BillingCycle } from "../../lib/platform/pricing";

const CYCLES: { id: BillingCycle; label: string; suffix: string }[] = [
  { id: "monthly", label: "Monthly", suffix: "/ month" },
  { id: "quarterly", label: "Quarterly", suffix: "/ 3 months" },
  { id: "biannual", label: "6-Month · Save 5%", suffix: "/ 6 months" },
  { id: "yearly", label: "Yearly · 2 mo free", suffix: "/ year" },
];

export function PricingMatrix() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const activeCycle = CYCLES.find((c) => c.id === cycle) ?? CYCLES[0];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Subscription plans</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Plans that grow with your shop.
          </h2>
          <p className="mt-2 text-sm text-navy/65">
            Save 2 months when you subscribe yearly. All prices in integer UGX.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Billing cycle"
          className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-navy/10 bg-white p-1.5 shadow-sm"
        >
          {CYCLES.map((item) => {
            const selected = item.id === cycle;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setCycle(item.id)}
                className={`min-h-11 rounded-xl px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                  selected
                    ? "bg-navy text-softwhite"
                    : "text-navy/70 hover:bg-teal-soft hover:text-navy"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {KAN_SUBSCRIPTION_PLANS.map((plan) => {
          const isPopular = Boolean(plan.popular);
          const price = plan.pricingUgx[cycle];
          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-5 shadow-sm ${
                isPopular
                  ? "border-navy bg-navy text-softwhite shadow-xl"
                  : "border-navy/10 bg-white text-navy"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                {isPopular ? (
                  <span className="rounded-full bg-teal px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
                    Popular
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <p
                  className={`ugx-amount text-2xl font-bold tracking-tight ${
                    isPopular ? "text-teal" : "text-navy"
                  }`}
                >
                  {ugx(price)}
                </p>
                <p
                  className={`text-xs ${
                    isPopular ? "text-softwhite/70" : "text-navy/60"
                  }`}
                >
                  {activeCycle.suffix}
                </p>
              </div>

              <ul
                className={`mt-5 flex-1 space-y-2.5 text-xs leading-snug ${
                  isPopular ? "text-softwhite/85" : "text-navy/75"
                }`}
              >
                <li className="flex items-start gap-2">
                  <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPopular ? "text-teal" : "text-navy"}`} />
                  <span>{plan.staffLimit === null ? "Unlimited staff" : `${plan.staffLimit} staff accounts`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPopular ? "text-teal" : "text-navy"}`} />
                  <span>{plan.branchLimit === null ? "Unlimited branches" : `${plan.branchLimit} ${plan.branchLimit === 1 ? "branch" : "branches"}`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPopular ? "text-teal" : "text-navy"}`} />
                  <span>{plan.businessLimit === null ? "Unlimited businesses" : `${plan.businessLimit} ${plan.businessLimit === 1 ? "business" : "businesses"}`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPopular ? "text-teal" : "text-navy"}`} />
                  <span>{plan.skuLimit === null ? "Unlimited products" : `Up to ${plan.skuLimit.toLocaleString()} SKUs`}</span>
                </li>
                <li className="flex items-start gap-2">
                  {plan.bulkUpload ? (
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPopular ? "text-teal" : "text-navy"}`} />
                  ) : (
                    <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-40" />
                  )}
                  <span>{plan.bulkUpload ? "Bulk CSV & branch import" : "Manual item entry"}</span>
                </li>
                <li className="flex items-start gap-2">
                  {plan.aiInsight ? (
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPopular ? "text-teal" : "text-navy"}`} />
                  ) : (
                    <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-40" />
                  )}
                  <span>{plan.aiInsight ? "Smart AI Assistant" : "Analytics only"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPopular ? "text-teal" : "text-navy"}`} />
                  <span>{plan.onlineStore}</span>
                </li>
              </ul>

              <Link
                href={`/app/signup?plan=${plan.id}`}
                className={`mt-6 w-full text-center text-xs ${
                  isPopular ? "btn-primary-dark" : "btn-secondary"
                }`}
              >
                Get started
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
