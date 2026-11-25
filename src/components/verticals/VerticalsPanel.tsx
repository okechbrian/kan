"use client";

import { useEffect, useState } from "react";
import { VERTICALS, type VerticalProfile } from "../../lib/verticals/profiles";
import { starterProducts, WAVE_LABELS } from "../../lib/verticals/workflows";
import Link from "next/link";
import { StatusBadge } from "../site/StatusBadge";

export function VerticalsPanel() {
  const [selected, setSelected] = useState("groceries");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("kan_vertical");
      if (saved) setSelected(saved);
    } catch {
      // Local preference is optional.
    }
  }, []);

  function choose(id: string) {
    setSelected(id);
    try {
      window.localStorage.setItem("kan_vertical", id);
    } catch {
      // Ignore storage failures; this is only a helper.
    }
  }

  const starters = starterProducts(selected);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Business type</h1>
        <p className="mt-2 text-sm text-ink/60">
          Pick the profile closest to your shop. Wave 1 runs on the till today; the
          others are planned.
        </p>
      </header>

      <Link href="/app/verticals/wave2" className="btn-secondary w-full sm:w-auto">
        See the wave 2 workflow preview
      </Link>

      <section className="card">
        <h2 className="text-base font-bold">Your profile</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {VERTICALS.filter((profile) => profile.state === "available").map((profile) => (
            <button
              key={profile.id}
              onClick={() => choose(profile.id)}
              className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold ${
                selected === profile.id
                  ? "bg-kan text-white"
                  : "bg-cream text-ink/60 hover:bg-kan-soft"
              }`}
            >
              {profile.name}
            </button>
          ))}
        </div>
        {starters.length > 0 ? (
          <div className="mt-4 rounded-xl bg-cream p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/40">
              Suggested starter items
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {starters.map((name) => (
                <li key={name} className="rounded-full bg-white px-3 py-1 text-xs text-ink/60">
                  {name}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink/40">
              Saved on this device only. Add these on the till when you are ready.
            </p>
          </div>
        ) : null}
      </section>

      {([1, 2, 3] as const).map((wave) => (
        <section key={wave}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">
            {WAVE_LABELS[wave]}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {VERTICALS.filter((profile) => profile.wave === wave).map(
              (profile: VerticalProfile) => (
                <article key={profile.id} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold">{profile.name}</h3>
                    <StatusBadge state={profile.state === "available" ? "now" : "soon"} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">
                    {profile.summary}
                  </p>
                </article>
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
