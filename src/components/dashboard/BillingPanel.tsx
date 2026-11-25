"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { ugx } from "../../lib/money";
import { KAN_SUBSCRIPTION_PLANS } from "../../lib/platform/pricing";
import { StatCard } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

type WorkspaceUsage = {
  subscription: { plan: string; status: string };
  usage: { staff: number; branches: number; skus: number };
};

export function BillingPanel() {
  const [data, setData] = useState<WorkspaceUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/platform/workspace");
        if (res.ok) {
          setData((await res.json()) as WorkspaceUsage);
        }
      } catch {
        // Offline / signed out fallback.
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const currentPlan = data?.subscription.plan ?? "basic";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">
              Billing & subscription
            </h1>
            <StatusBadge state="now" />
          </div>
          <p className="mt-1 text-sm text-navy/65">
            Compare plans in integer UGX and view current branch, staff and SKU usage.
          </p>
        </div>
        <Link href="/pricing" className="btn-secondary text-xs">
          Full pricing comparison
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Active plan"
          value={loading ? "..." : currentPlan.toUpperCase()}
          delta={data?.subscription.status ?? "local"}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatCard label="Staff used" value={String(data?.usage.staff ?? 1)} />
        <StatCard label="Branches used" value={String(data?.usage.branches ?? 1)} />
        <StatCard label="Products (SKUs)" value={String(data?.usage.skus ?? 0)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {KAN_SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <article
              key={plan.id}
              className={`card flex flex-col justify-between ${
                isCurrent ? "border-navy bg-teal-soft" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-navy">{plan.name}</h2>
                  {isCurrent ? (
                    <span className="rounded-full bg-navy px-2.5 py-0.5 text-[10px] font-bold uppercase text-softwhite">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="ugx-amount mt-2 text-2xl font-bold text-navy">
                  {ugx(plan.pricingUgx.monthly)}{" "}
                  <span className="text-xs font-normal text-navy/65">/ month</span>
                </p>
                <p className="mt-2 text-xs text-navy/75">
                  {plan.staffLimit ?? "Unlimited"} staff · {plan.branchLimit ?? "Unlimited"}{" "}
                  branches · {plan.skuLimit ?? "Unlimited"} SKUs
                </p>
              </div>
              <Link
                href={data ? "/app/business/branch" : "/app/sign-in"}
                className="btn-secondary mt-4 text-xs"
              >
                {data ? "Manage workspace" : "Sign in to manage"}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
