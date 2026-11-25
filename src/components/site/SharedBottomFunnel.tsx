"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Gift, Mail, MessageCircle, Plus, ShieldCheck } from "lucide-react";
import { PWATA_CONTACT } from "../../lib/platform/pricing";
import { PricingMatrix } from "./PricingMatrix";

const FAQS = [
  {
    q: "What is Kan?",
    a: "Kan (by Pwata Inc) is a commerce platform for Ugandan shops. It gives you an offline-first phone till, stock and customer credit (deni) books, and online tools to grow.",
  },
  {
    q: "Do I need to download Kan on my computer to use the web version?",
    a: "No. Both the till and the merchant dashboard run directly in your browser. Installable mobile and desktop apps are also on the roadmap.",
  },
  {
    q: "Does the till work when the internet drops?",
    a: "Yes. Counter sales, stock updates, deni records and shift closes save locally on your device first and sync when connectivity returns.",
  },
  {
    q: "Is there a yearly discount?",
    a: "Yes. Paying yearly gives you 2 months free compared to 12 monthly payments, and 6-month billing gives 5% off.",
  },
  {
    q: "Can I cancel whenever I want?",
    a: "Yes. You can cancel before the next billing cycle and export your full shop books as a JSON backup at any time.",
  },
  {
    q: "How can I monitor staff activities in the shop?",
    a: "Each attendant signs in with their own PIN, every sale and stock movement records who performed it, and owners can review staff totals and void sales.",
  },
];

export function SharedBottomFunnel({
  showPricing = true,
  showFaq = true,
}: {
  showPricing?: boolean;
  showFaq?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubscribe(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setFeedback("");
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus("error");
        setFeedback("Enter a valid email address.");
        return;
      }
      setStatus("done");
      setFeedback(data.message ?? "Subscribed.");
      setEmail("");
    } catch {
      setStatus("error");
      setFeedback("Network error — try again when online.");
    }
  }

  return (
    <>
      <section className="bg-navy text-softwhite">
        <div className="section flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal">
              Ready at the counter
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Manage your shop online and offline — even without internet.
            </h2>
            <p className="mt-3 text-sm text-softwhite/75">
              Start selling at the till right away, or register a workspace for your
              branches.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/pos" className="btn-primary-dark">
              Open your till
            </Link>
            <Link
              href="/app/signup"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-3 text-sm font-bold text-softwhite transition hover:bg-white/10"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {showPricing ? (
        <section className="section border-t border-navy/10">
          <PricingMatrix />
        </section>
      ) : null}

      <section className="section border-t border-navy/10">
        <p className="eyebrow">Built for Ugandan shops</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy">
          Grounded at the shop counter — never invented proof.
        </h2>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <article className="card">
            <ShieldCheck className="h-6 w-6 text-navy" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-bold text-navy">Counter first</h3>
            <p className="mt-2 text-sm text-navy/70">
              Built around real shop tasks in Entebbe and Kampala: fast movers, deni
              (customer credit) and closing the cash drawer.
            </p>
          </article>
          <article className="card">
            <ShieldCheck className="h-6 w-6 text-navy" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-bold text-navy">Integer UGX math</h3>
            <p className="mt-2 text-sm text-navy/70">
              Every shilling is stored as an exact integer. Split cash and mobile money
              tenders always sum to the sale total.
            </p>
          </article>
          <article className="card">
            <ShieldCheck className="h-6 w-6 text-navy" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-bold text-navy">Honest feature labels</h3>
            <p className="mt-2 text-sm text-navy/70">
              We never publish fake customer counts or reviews. Every tool clearly states
              whether it is available now, coming soon or with a partner.
            </p>
          </article>
        </div>
      </section>

      {showFaq ? (
        <section className="section border-t border-navy/10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Questions</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy">
                Frequently asked questions
              </h2>
            </div>
            <Link href="/help" className="btn-secondary text-sm">
              Contact support
            </Link>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-2">
            {FAQS.map((item) => (
              <details key={item.q} className="card group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold text-navy marker:hidden">
                  {item.q}
                  <Plus className="h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-navy/70">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section border-t border-navy/10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-navy p-7 text-softwhite">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal">
              <Gift className="h-3.5 w-3.5" aria-hidden="true" />
              Refer a friend
            </div>
            <h2 className="mt-4 text-2xl font-bold">
              Refer a shopkeeper and earn 1 month free
            </h2>
            <p className="mt-2 text-sm text-softwhite/75">
              Invite another Ugandan shop to open on Kan and receive one month of
              subscription credit once paid billing launches.
            </p>
            <a
              href={`https://wa.me/${PWATA_CONTACT.phoneIntl.replace("+", "")}?text=${encodeURIComponent(
                "Hello Pwata Inc, I would like to refer a shop to Kan.",
              )}`}
              className="btn-primary-dark mt-6 gap-2 text-sm"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Refer via WhatsApp
            </a>
          </div>

          <div className="rounded-3xl border border-navy/10 bg-white p-7 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              Updates
            </div>
            <h2 className="mt-4 text-2xl font-bold text-navy">Join our newsletter</h2>
            <p className="mt-2 text-sm text-navy/70">
              Receive product updates when new Kan modules, Android releases and payment
              integrations go live.
            </p>
            <form onSubmit={handleSubscribe} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@shop.ug"
                className="min-h-11 flex-1 rounded-xl border border-navy/20 bg-softwhite px-4 py-2.5 text-sm text-navy placeholder:text-navy/45"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary shrink-0 text-sm"
              >
                {status === "sending" ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
            {feedback ? (
              <p
                className={`mt-3 text-xs font-semibold ${
                  status === "error" ? "text-guava-dark" : "text-navy"
                }`}
              >
                {feedback}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
