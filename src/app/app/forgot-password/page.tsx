"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Input } from "../../../components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setResetToken("");
    try {
      const res = await fetch("/api/platform/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        resetToken?: string;
        error?: string;
      };
      if (!res.ok) {
        setMessage("Enter a valid account email address.");
        return;
      }
      setMessage(
        "If an account exists for that email, a reset token has been generated (valid for 1 hour).",
      );
      if (data.resetToken) setResetToken(data.resetToken);
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@shop.ug"
        />
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Requesting..." : "Request password reset"}
        </button>

        {message ? (
          <div className="space-y-2 rounded-xl bg-teal-soft p-3 text-xs font-semibold text-navy">
            <p>{message}</p>
            {resetToken ? (
              <div className="rounded-lg bg-white p-2.5 text-navy">
                <p className="text-[11px] text-navy/65">
                  SMTP is not yet configured — use this one-time token to continue:
                </p>
                <p className="mt-1 break-all font-mono text-xs">{resetToken}</p>
                <Link
                  href={`/app/reset-password?token=${encodeURIComponent(resetToken)}`}
                  className="mt-2 inline-block font-bold underline"
                >
                  Continue to reset password →
                </Link>
              </div>
            ) : null}
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
