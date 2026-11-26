"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "../../../components/ui";

function ResetPasswordForm() {
  const params = useSearchParams();
  const [token] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (params.has("token")) window.history.replaceState(null, "", window.location.pathname);
  }, [params]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/platform/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(
          data.error === "invalid_password"
            ? "New password must be at least 10 characters."
            : data.error === "invalid_reset_token" ? "That reset link is invalid or has expired. Request a new one." : "Could not update your password. Try again shortly.",
        );
        return;
      }
      setDone(true);
      setPassword("");
      setMessage("Password updated. All previous sessions have been signed out.");
    } catch {
      setMessage("Network error. Try again when online.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <div className="card space-y-4"><p role="status">{message}</p><Link href="/app/sign-in" className="btn-primary">Sign in with your new password</Link></div>;
  if (!token) return <div className="card space-y-4"><p>Open the one-time link from your reset email to choose a new password.</p><Link href="/app/forgot-password" className="btn-primary">Request a reset link</Link></div>;

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <Input
        label="New password"
        type="password"
        required
        minLength={10}
        maxLength={200}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        helperText="Minimum 10 characters."
      />
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Updating..." : "Set new password"}
      </button>
      {message ? (
        <p
          role="status"
          className={`rounded-xl p-3 text-xs font-semibold ${
            done ? "bg-teal-soft text-navy" : "bg-guava-soft text-navy"
          }`}
        >
          {message}
        </p>
      ) : null}
      <p className="text-sm text-navy/65">
        <Link href="/app/sign-in" className="font-bold text-navy underline">
          Go to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-navy">Reset password</h1>
        <p className="mt-2 text-sm text-navy/70">
          Choose a new password for your Kan workspace account. Till PINs are managed separately.
        </p>
      </header>
      <Suspense fallback={<div className="card text-sm text-navy/65">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
