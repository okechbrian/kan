"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Building2, Plus } from "lucide-react";
import { Input } from "../../../../components/ui";
import { StatusBadge } from "../../../../components/site/StatusBadge";

type BranchRow = {
  id: string;
  name: string;
  shop_code: string;
  momo_number: string;
  currency: string;
};

type WorkspacePayload = {
  business: { id: string; name: string } | null;
  subscription: { plan: string; status: string };
  shops: BranchRow[];
};

export default function BusinessBranchPage() {
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [name, setName] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function loadWorkspace() {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/workspace");
      if (res.status === 401) {
        setUnauthenticated(true);
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as WorkspacePayload;
      setWorkspace(data);
      setUnauthenticated(false);
    } catch {
      // Offline fallback — keep page usable.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  async function handleCreateBranch(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFeedback("");
    try {
      const res = await fetch("/api/platform/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, momoNumber }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        shop?: BranchRow;
      };
      if (!res.ok) {
        setFeedback(
          data.error === "branches_limit_reached"
            ? "Your current plan branch limit has been reached. Upgrade your plan to add more branches."
            : "Could not add branch. Check the name and try again.",
        );
        return;
      }
      setName("");
      setMomoNumber("");
      setFeedback(
        `Branch created (${data.shop?.name}). Pair a till device using code ${data.shop?.shop_code}.`,
      );
      await loadWorkspace();
    } catch {
      setFeedback("Offline — connect to the internet to add a cloud branch.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            Shops & branches
          </h1>
          <StatusBadge state="now" />
        </div>
        <p className="mt-2 text-sm text-navy/70">
          Each branch has its own shop code for pairing counter till devices. Stock and
          customer credit (deni) stay strictly separated per branch.
        </p>
      </header>

      {loading ? (
        <div className="card text-sm text-navy/65">Loading workspace branches...</div>
      ) : unauthenticated ? (
        <div className="card space-y-3">
          <h2 className="text-lg font-bold text-navy">Sign in to manage cloud branches</h2>
          <p className="text-sm text-navy/70">
            Create or sign in to a workspace first, or manage local till shops directly.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/sign-in" className="btn-primary text-sm">
              Sign in
            </Link>
            <Link href="/app/signup" className="btn-secondary text-sm">
              Create workspace
            </Link>
            <Link href="/shops" className="btn-quiet text-sm">
              Local till shops
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="card flex flex-wrap items-center justify-between gap-2 bg-teal-soft">
              <div>
                <p className="text-xs font-bold uppercase text-navy/65">Workspace</p>
                <p className="text-lg font-bold text-navy">
                  {workspace?.business?.name ?? "Your business"}
                </p>
              </div>
              <span className="rounded-full bg-navy px-3 py-1 text-xs font-bold uppercase text-softwhite">
                {workspace?.subscription.plan ?? "basic"} plan
              </span>
            </div>

            <div className="space-y-3">
              {(workspace?.shops ?? []).map((shop) => (
                <article
                  key={shop.id}
                  className="card flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-soft text-navy">
                      <Building2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-navy">{shop.name}</h2>
                      <p className="text-xs text-navy/65">
                        Shop code:{" "}
                        <span className="font-mono font-bold text-navy">
                          {shop.shop_code}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Link href={`/app/business/pair?shop=${encodeURIComponent(shop.id)}`} className="btn-secondary text-xs">
                    Pair till
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateBranch} className="card space-y-4 lg:col-span-5">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-navy" aria-hidden="true" />
              <h2 className="text-lg font-bold text-navy">Add a branch</h2>
            </div>
            <Input
              label="Branch name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nakasero Branch"
            />
            <Input
              label="Branch MoMo number (optional)"
              value={momoNumber}
              onChange={(e) => setMomoNumber(e.target.value)}
              placeholder="0791149592"
            />
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Creating..." : "Create branch"}
            </button>
            {feedback ? (
              <p className="rounded-xl bg-teal-soft p-3 text-xs font-semibold text-navy">
                {feedback}
              </p>
            ) : null}
          </form>
        </div>
      )}
    </div>
  );
}
