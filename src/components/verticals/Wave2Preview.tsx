"use client";

import { useState } from "react";
import Link from "next/link";
import {
  dispenseBatches,
  productionPlan,
  slotsForDay,
  nextLaundryState,
  type Booking,
} from "../../lib/verticals/wave2";
import { StatusBadge } from "../site/StatusBadge";

const DEMO_BATCHES = [
  { id: "B1", productId: "p1", quantity: 5, expiryDate: "2026-12-01", warehouseId: "w1" },
  { id: "B2", productId: "p1", quantity: 3, expiryDate: "2020-01-01", warehouseId: "w1" },
];

const BOOKINGS: Booking[] = [
  {
    id: "bk1",
    service: "Haircut",
    staff: "Asha",
    start: "2026-11-25T10:00:00Z",
    durationMinutes: 60,
  },
];

export function Wave2Preview() {
  const [quantity, setQuantity] = useState(2);
  const [units, setUnits] = useState(4);

  const dispense = dispenseBatches(DEMO_BATCHES, quantity, new Date("2026-11-25T00:00:00Z"));
  const ingredients = productionPlan(
    [
      { name: "Flour", gramsPerUnit: 500 },
      { name: "Sugar", gramsPerUnit: 100 },
    ],
    units
  );
  const slots = slotsForDay(BOOKINGS, "2026-11-25", 30, "Asha").filter(
    (slot) => slot.free
  ).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight">Wave 2 preview</h1>
        <StatusBadge state="soon" />
      </header>
      <p className="text-sm text-ink/60">
        These helpers are built and tested, but the full workflows are not enabled in
        the till yet. Nothing here changes stock or books an appointment.
      </p>

      <section className="card">
        <h2 className="text-base font-bold">Pharmacy · batch dispensing</h2>
        <label className="mt-3 block text-sm">
          Quantity
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(parseInt(event.target.value, 10) || 1)}
            className="mt-1 w-full rounded-xl border border-black/15 px-4 py-3"
          />
        </label>
        <p className="mt-3 text-sm text-ink/60">
          Allocations: {dispense.allocations.map((a) => `${a.batchId}×${a.quantity}`).join(", ") || "none"}
          {dispense.shortfall > 0 ? ` · short ${dispense.shortfall}` : ""}
          {dispense.blocked.length > 0 ? ` · expired skipped: ${dispense.blocked.join(", ")}` : ""}
        </p>
      </section>

      <section className="card">
        <h2 className="text-base font-bold">Bakery · production plan</h2>
        <label className="mt-3 block text-sm">
          Units to bake
          <input
            type="number"
            min={1}
            value={units}
            onChange={(event) => setUnits(parseInt(event.target.value, 10) || 1)}
            className="mt-1 w-full rounded-xl border border-black/15 px-4 py-3"
          />
        </label>
        <p className="mt-3 text-sm text-ink/60">
          {ingredients.map((item) => `${item.name} ${item.grams}g`).join(" · ")}
        </p>
      </section>

      <section className="card">
        <h2 className="text-base font-bold">Salon · booking slots</h2>
        <p className="mt-3 text-sm text-ink/60">
          {slots} free 30-minute slots on 25 Nov 2026 (demo booking for Asha at 10:00).
        </p>
      </section>

      <section className="card">
        <h2 className="text-base font-bold">Laundry · ticket flow</h2>
        <p className="mt-3 text-sm text-ink/60">
          received → washing → ready → collected. Next after &ldquo;ready&rdquo; is{" "}
          {nextLaundryState("ready") ?? "none"}.
        </p>
      </section>

      <Link href="/app/verticals" className="btn-secondary">
        Back to business types
      </Link>
    </div>
  );
}
