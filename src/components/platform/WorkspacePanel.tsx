"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Workspace = {
  account: { email: string; role: string };
  business: { id: string; name: string };
  shops: { id: string; name: string; currency: string }[];
};

export function WorkspacePanel() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [state, setState] = useState("loading");
  const [busy, setBusy] = useState(false);

  async function load(signal?: AbortSignal) {
    setWorkspace(null);
    setState("loading");
    try {
      const response = await fetch("/api/platform/workspace?summary=1", { cache: "no-store", signal });
      if (response.status === 401) { setState("signed-out"); return; }
      if (!response.ok) throw new Error("workspace_unavailable");
      const data = await response.json() as Workspace;
      if (!data.business || !data.account || !Array.isArray(data.shops)) throw new Error("incomplete_workspace");
      setWorkspace(data);
      setState("ready");
    } catch {
      if (!signal?.aborted) setState("error");
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/platform/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) throw new Error("logout_failed");
      setWorkspace(null);
      window.location.replace("/app/sign-in");
    } catch { setState("logout-error"); }
    finally { setBusy(false); }
  }

  if (state === "loading") return <p role="status">Loading your workspace…</p>;
  if (state === "signed-out") return <section className="card space-y-4"><h1 className="text-2xl font-bold">Sign in to your workspace</h1><p>Your owner account keeps your business and branches together.</p><Link href="/app/sign-in" className="btn-primary">Sign in</Link><Link href="/app/signup" className="btn-secondary">Create workspace</Link></section>;
  if (!workspace) return <section className="card space-y-4"><h1 className="text-2xl font-bold">Could not load your workspace</h1><p role="alert">Check your connection and try again. Your existing till can keep selling offline.</p><button className="btn-primary" onClick={() => void load()}>Try again</button><Link href="/pos" className="btn-secondary">Open existing till</Link></section>;

  return <div className="mx-auto max-w-3xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><p className="text-sm font-bold text-navy/70">Your workspace</p><h1 className="break-words text-3xl font-bold text-navy">{workspace.business.name}</h1><p className="mt-2 break-all text-sm text-navy/70">Signed in as {workspace.account.email}</p></div>
      <button className="btn-secondary" disabled={busy} onClick={() => void signOut()}>{busy ? "Signing out…" : "Sign out"}</button>
    </header>
    {state === "logout-error" ? <p role="alert">Could not sign out. Check your connection and try again.</p> : null}
    <section className="card space-y-4" aria-labelledby="workspace-branches">
      <h2 id="workspace-branches" className="text-xl font-bold">Your branches</h2>
      {workspace.shops.length ? workspace.shops.map((shop) => <article key={shop.id} className="rounded-xl border border-navy/15 p-4"><h3 className="break-words font-bold">{shop.name}</h3><p className="text-sm text-navy/70">Currency: {shop.currency}</p>{workspace.account.role === "owner" ? <Link href={`/app/business/pair?shop=${encodeURIComponent(shop.id)}`} className="btn-primary mt-3">Connect till</Link> : null}</article>) : <p>No branch is available. Open branch settings to finish your business setup.</p>}
      {workspace.account.role === "owner" ? <Link href="/app/business/branch" className="btn-secondary">View branch settings</Link> : null}
    </section>
    <section className="card space-y-3"><h2 className="text-xl font-bold">Your next step</h2><p>Connect a branch above to save its books on this device. Existing tills can keep selling offline.</p><Link href="/pos" className="btn-primary">Open existing till</Link></section>
  </div>;
}
