"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "../ui";
import { activateCloudBranch, assertPairingDestination, installCloudBranch } from "../../lib/cloud-pairing";

export function BranchPairingPanel() {
  const shopId = useSearchParams().get("shop") ?? "";
  const [branch, setBranch] = useState<{ id: string; name: string } | null>(null);
  const [state, setState] = useState("loading");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const submitting = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/platform/workspace?summary=1", { cache: "no-store", signal: controller.signal });
        if (response.status === 401) { setState("signed-out"); return; }
        if (!response.ok) throw new Error("Could not load your workspace. Connect to the internet and try again.");
        const workspace = await response.json();
        if (workspace.account?.role !== "owner") throw new Error("Only the workspace owner can connect a till.");
        const selected = workspace.shops.find((shop: { id: string }) => shop.id === shopId);
        if (!selected) throw new Error("This branch is not available in your workspace.");
        setBranch(selected);
        if (await activateCloudBranch(shopId)) { setState("connected"); return; }
        await assertPairingDestination(shopId, workspace.business.id);
        setState("ready");
      } catch (reason) { if (!controller.signal.aborted) { setError(reason instanceof Error ? reason.message : "Could not load this branch."); setState("error"); } }
    })();
    return () => controller.abort();
  }, [shopId]);
  async function connect(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (!/^\d{4,6}$/.test(pin) || pin !== confirm) { setError("Enter the same 4–6 digit owner PIN twice."); return; }
    submitting.current = true; setState("connecting"); setError("");
    try {
      await assertPairingDestination(shopId);
      let deviceId = localStorage.getItem("kan_cloud_pair_device_id");
      if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem("kan_cloud_pair_device_id", deviceId); }
      const response = await fetch("/api/platform/pair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shopId, deviceId, pin }) });
      const data = await response.json();
      if (!response.ok) {
        const messages: Record<string, string> = { invalid_owner_pin: "The owner PIN is incorrect. Use the PIN already set for this business.", device_already_bound: "This device is already connected to another branch. Keep its books and use an empty browser profile.", forbidden: "Sign in as the workspace owner to connect this branch.", branch_not_found: "This branch is not available in your workspace." };
        throw new Error(messages[data.error] ?? "Could not connect. Your existing books were kept. Check your connection and retry.");
      }
      await installCloudBranch(data, shopId, deviceId);
      setPin(""); setConfirm(""); setState("connected");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Connection interrupted. Retry to finish connecting this branch."); setState("ready"); }
    finally { submitting.current = false; }
  }
  if (state === "loading") return <p role="status">Loading branch…</p>;
  if (state === "signed-out") return <section className="card space-y-4"><h1 className="text-2xl font-bold">Sign in to connect your till</h1><Link href="/app/sign-in" className="btn-primary">Sign in</Link></section>;
  return <section className="card mx-auto max-w-md space-y-5">
    <h1 className="break-words text-2xl font-bold">{state === "connected" ? "Till connected" : "Connect this branch"}</h1>
    {branch ? <p className="break-words font-bold">{branch.name}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {state === "connected" ? <><p>Your branch books are saved on this device. Open the till once while online, then use your owner PIN to unlock it offline. Clearing browser data removes local books; keep backups.</p><Link href="/pin" className="btn-primary">Unlock connected till</Link></> : state !== "error" ? <form onSubmit={connect} className="space-y-4">
      <p>Use this business’s existing owner PIN. If this is its first till, choose a PIN now. This connects your existing branch and does not create another shop.</p>
      <Input label="Owner PIN" type="password" inputMode="numeric" pattern="[0-9]{4,6}" minLength={4} maxLength={6} autoComplete="off" required value={pin} onChange={(event) => setPin(event.target.value)} />
      <Input label="Repeat owner PIN" type="password" inputMode="numeric" pattern="[0-9]{4,6}" minLength={4} maxLength={6} autoComplete="off" required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
      <button className="btn-primary w-full" disabled={state === "connecting"}>{state === "connecting" ? "Connecting…" : "Connect till"}</button>
      <p className="text-sm">Existing local books and unsent sales are kept. Use an empty browser profile when connecting a different till.</p>
    </form> : null}
    <Link href="/app/workspace" className="btn-secondary">Back to workspace</Link>
  </section>;
}
