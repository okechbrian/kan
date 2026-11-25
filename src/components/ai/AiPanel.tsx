"use client";

import { useState } from "react";
import { StatusBadge } from "../site/StatusBadge";

const SAFE =
  "I cannot answer that yet. Ask about using the till, stock, credit or reports. When a live AI service is connected, answers will come from your own records.";

export function AiPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  async function ask() {
    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json().catch(() => ({}));
      setAnswer(String(data.answer ?? SAFE));
    } catch {
      setAnswer(SAFE);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight">AI assistant</h1>
        <StatusBadge state="partner" />
      </header>
      <p className="text-sm text-ink/60">
        Answers will come from your own records with strict guardrails. A live model is
        not connected yet — nothing here is invented.
      </p>
      <div className="card">
        <label className="block text-sm font-semibold text-ink">
          Ask a question
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base"
            placeholder="How do I close the till?"
          />
        </label>
        <button onClick={() => void ask()} className="btn-primary mt-3">
          Ask
        </button>
        {answer ? (
          <p role="status" className="mt-4 rounded-xl bg-cream p-4 text-sm leading-relaxed text-ink/70">
            {answer}
          </p>
        ) : null}
      </div>
    </div>
  );
}
