"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { db } from "../../lib/db";
import { ugx } from "../../lib/money";
import { StatusBadge } from "../site/StatusBadge";

const SAFE =
  "I cannot answer that yet. Ask about using the till, stock, credit or reports. When a live AI service is connected, answers will come from your own records.";

const QUICK_PROMPTS = [
  "How do I close the till and check cash variance?",
  "How does credit (deni) collection work?",
  "How do I pair a second phone to my shop?",
  "How do I export a backup of my shop books?",
];

export function AiPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [snapshot, setSnapshot] = useState<{
    todaySales: number;
    lowStock: number;
    deniTotal: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const prefix = new Date().toISOString().slice(0, 10);
      const [sales, products, customers] = await Promise.all([
        db.sales.toArray(),
        db.products.toArray(),
        db.customers.toArray(),
      ]);
      const todaySales = sales
        .filter((s) => s.status === "completed" && s.created_at.startsWith(prefix))
        .reduce((sum, s) => sum + s.total, 0);
      const lowStock = products.filter((p) => p.active && p.stock_qty <= 5).length;
      const deniTotal = customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0);
      setSnapshot({ todaySales, lowStock, deniTotal });
    }
    void load();
  }, []);

  async function ask(q?: string) {
    const promptText = (q ?? question).trim();
    if (!promptText || asking) return;
    if (q) setQuestion(q);
    setAsking(true);
    try {
      const context = snapshot
        ? `Today sales: ${ugx(snapshot.todaySales)}; Low stock items: ${snapshot.lowStock}; Open deni: ${ugx(snapshot.deniTotal)}.`
        : "";
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: promptText, context }),
      });
      const data = await response.json().catch(() => ({}));
      setAnswer(String(data.answer ?? SAFE));
    } catch {
      setAnswer(SAFE);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy sm:text-3xl">
          <Sparkles className="h-6 w-6 text-teal" />
          AI assistant
        </h1>
        <StatusBadge state="partner" />
      </header>
      <p className="text-sm text-navy/65">
        Enterprise feature with strict guardrails (phone/email redaction, crisis
        detection, no invented figures). A live LLM key is not connected yet —
        nothing here is fabricated.
      </p>

      {snapshot && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-navy/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-navy/60">
              Local today sales
            </p>
            <p className="ugx-amount mt-1 text-xl font-bold text-navy">
              {ugx(snapshot.todaySales)}
            </p>
          </div>
          <div className="rounded-2xl border border-navy/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-navy/60">
              Low stock alerts
            </p>
            <p className="ugx-amount mt-1 text-xl font-bold text-navy">
              {snapshot.lowStock}
            </p>
          </div>
          <div className="rounded-2xl border border-navy/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-navy/60">
              Open credit (deni)
            </p>
            <p className="ugx-amount mt-1 text-xl font-bold text-navy">
              {ugx(snapshot.deniTotal)}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => void ask(item)}
              className="rounded-full border border-navy/15 bg-softwhite px-3 py-1.5 text-xs font-semibold text-navy hover:bg-teal/20"
            >
              {item}
            </button>
          ))}
        </div>
        <label className="block text-sm font-semibold text-navy">
          Ask a question
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-navy"
            placeholder="How do I close the till?"
          />
        </label>
        <button
          type="button"
          onClick={() => void ask()}
          disabled={asking || !question.trim()}
          className="btn-primary mt-3 disabled:opacity-50"
        >
          {asking ? "Checking..." : "Ask"}
        </button>
        {answer ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-navy/10 bg-softwhite p-4 text-sm leading-relaxed text-navy/80"
          >
            {answer}
          </p>
        ) : null}
      </div>
    </div>
  );
}
