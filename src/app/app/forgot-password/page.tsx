"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Input } from "../../../components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/platform/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setMessage(data.error === "invalid_email" ? "Enter a valid account email address." : "Password reset email is temporarily unavailable. Try again later or contact support.");
        return;
      }
      setMessage(
        "If that account exists, check your email for a reset link. It expires in one hour. Wait one minute before trying again; check spam too.",
      );
    } catch {
      setMessage("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-navy">Forgot password</h1>
        <p className="mt-2 text-sm text-navy/70">
          Enter your workspace owner email to start a password reset.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <Input
          label="Account email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@shop.ug"
        />
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Requesting..." : "Request password reset"}
        </button>

        {message ? (
          <div className="space-y-2 rounded-xl bg-teal-soft p-3 text-xs font-semibold text-navy">
            <p role="status">{message}</p>
          </div>
        ) : null}

        <p className="text-sm text-navy/65">
          Remembered it?{" "}
          <Link href="/app/sign-in" className="font-bold text-navy underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
