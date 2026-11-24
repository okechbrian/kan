"use client";

import { useState } from "react";
import Link from "next/link";

const NOT_CONFIGURED = "The platform opens when cloud sync is configured. You can keep using the till offline.";

type Mode = "sign-in" | "signup";

export function AuthForms({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [shopName, setShopName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const endpoint = mode === "signup" ? "/api/platform/signup" : "/api/platform/login";
      const payload =
        mode === "signup"
          ? { businessName, shopName, email, password }
          : { email, password };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (data.error === "database_not_configured") {
        setMessage(NOT_CONFIGURED);
        return;
      }
      if (!response.ok) {
        setMessage("That did not work. Check the details and try again.");
        return;
      }
      setMessage(mode === "signup" ? "Workspace created. Welcome to Kan." : "Signed in.");
      window.location.href = "/app/dashboard";
    } catch {
      setMessage(NOT_CONFIGURED);
    } finally {
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <form onSubmit={submit} className="card space-y-4">
      {isSignup ? (
        <>
          <label className="block text-sm font-semibold text-ink">
            Business name
            <input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              required
              minLength={2}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base"
            />
          </label>
          <label className="block text-sm font-semibold text-ink">
            First shop name
            <input
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              required
              minLength={2}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base"
            />
          </label>
        </>
      ) : null}
      <label className="block text-sm font-semibold text-ink">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base"
        />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={isSignup ? 10 : 1}
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base"
        />
      </label>
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Please wait..." : isSignup ? "Create workspace" : "Sign in"}
      </button>
      {message ? (
        <p role="status" className="rounded-xl bg-kan-soft p-3 text-sm text-kan-dark">
          {message}
        </p>
      ) : null}
      <p className="text-sm text-ink/55">
        {isSignup ? "Already have a workspace?" : "New to Kan?"}{" "}
        <Link
          href={isSignup ? "/app/sign-in" : "/app/signup"}
          className="font-semibold text-kan underline"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
