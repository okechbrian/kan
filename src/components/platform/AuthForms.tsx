"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Input } from "../ui";

const NOT_CONFIGURED =
  "The platform opens when cloud sync is configured. You can keep using the till offline.";

const ERROR_COPY: Record<string, string> = {
  email_taken: "An account with this email already exists. Try signing in instead.",
  invalid_password: "Password must be at least 10 characters long.",
  invalid_credentials: "Incorrect email or password.",
  account_inactive: "This account is inactive. Contact your shop owner.",
  invalid_business_name: "Business name must be between 2 and 80 characters.",
  invalid_shop_name: "First shop name must be between 2 and 80 characters.",
  invalid_email: "Enter a valid owner email address.",
  platform_temporarily_unavailable: "The connection to your workspace was interrupted. Retry with the same details; your business will not be created twice.",
};

type Mode = "sign-in" | "signup";

export function AuthForms({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [shopName, setShopName] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (mode === "signup") {
      try {
        const draft = JSON.parse(sessionStorage.getItem("kan.signup.v1") ?? "null");
        if (draft && typeof draft === "object") {
          setBusinessName(typeof draft.businessName === "string" ? draft.businessName : "");
          setShopName(typeof draft.shopName === "string" ? draft.shopName : "");
          setEmail(typeof draft.email === "string" ? draft.email : "");
        }
      } catch { /* Storage can be unavailable; registration still works. */ }
    }
    setDraftReady(true);
    const controller = new AbortController();
    void fetch("/api/platform/session", { cache: "no-store", signal: controller.signal })
      .then((response) => { if (response.ok) window.location.replace("/app/workspace"); })
      .catch(() => {});
    return () => controller.abort();
  }, [mode]);

  useEffect(() => {
    if (mode !== "signup" || !draftReady) return;
    try {
      sessionStorage.setItem("kan.signup.v1", JSON.stringify({ businessName, shopName, email }));
    } catch { /* Never persist the password or session token. */ }
  }, [mode, draftReady, businessName, shopName, email]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setMessage("");
    setIsError(false);
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
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (data.error === "database_not_configured") {
        setIsError(true);
        setMessage(NOT_CONFIGURED);
        return;
      }
      if (!response.ok) {
        setIsError(true);
        setMessage(
          ERROR_COPY[data.error ?? ""] ??
            "Could not complete that request. Check your details and try again.",
        );
        return;
      }
      setMessage(mode === "signup" ? "Workspace created. Welcome to Kan." : "Signed in.");
      try { sessionStorage.removeItem("kan.signup.v1"); } catch { /* Optional draft only. */ }
      window.location.replace("/app/workspace");
    } catch {
      setIsError(true);
      setMessage("Connection interrupted. Your details are kept in this tab. Retry with the same password, or sign in if your workspace was already created.");
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }

  const isSignup = mode === "signup";

  return (
    <form onSubmit={submit} className="card space-y-4" aria-busy={busy}>
      {isSignup ? (
        <>
          <Input
            label="Business name"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
            autoComplete="organization"
            placeholder="e.g. Kiwafu General Traders"
          />
          <Input
            label="First shop / branch name"
            value={shopName}
            onChange={(event) => setShopName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
            placeholder="e.g. Entebbe Main"
          />
        </>
      ) : null}
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        maxLength={254}
        autoComplete="email"
        placeholder="owner@shop.ug"
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={isSignup ? 10 : 1}
        maxLength={200}
        autoComplete={isSignup ? "new-password" : "current-password"}
        helperText={isSignup ? "Minimum 10 characters." : undefined}
      />
      {!isSignup ? (
        <div className="flex justify-end">
          <Link
            href="/app/forgot-password"
            className="text-xs font-bold text-navy underline hover:text-navy-light"
          >
            Forgot password?
          </Link>
        </div>
      ) : null}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Please wait..." : isSignup ? "Create workspace" : "Sign in"}
      </button>
      {message ? (
        <p
          role="status"
          className={`rounded-xl p-3 text-sm font-semibold ${
            isError ? "bg-guava-soft text-navy" : "bg-teal-soft text-navy"
          }`}
        >
          {message}
        </p>
      ) : null}
      <p className="text-sm text-navy/65">
        {isSignup ? "Already have a workspace?" : "New to Kan?"}{" "}
        <Link
          href={isSignup ? "/app/sign-in" : "/app/signup"}
          className="font-bold text-navy underline"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
