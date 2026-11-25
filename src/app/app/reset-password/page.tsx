"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "../../../components/ui";

function ResetPasswordForm() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

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
            : "That reset token is invalid or has expired.",
        );
        return;
      }
      setDone(true);
      setMessage("Password updated. All previous sessions have been signed out.");
    } catch {
      setMessage("Network error. Try again when online.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <Input
        label="Reset token"
        required
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste your one-time token"
      />
      <Input
        label="New password"
        type="password"
        required
        minLength={10}
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
          Choose a new password for your Kan owner or staff account.
        </p>
      </header>
      <Suspense fallback={<div className="card text-sm text-navy/65">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
