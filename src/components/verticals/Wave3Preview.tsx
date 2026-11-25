"use client";

import { useState } from "react";
import Link from "next/link";
import {
  explodeBom,
  productionBatchCode,
  validateSerial,
  warrantyExpiry,
  underWarranty,
  deliveryQuote,
  nextDeliveryState,
} from "../../lib/verticals/wave3";
import { StatusBadge } from "../site/StatusBadge";

const BOM = [
  { sku: "Wood panel", quantityPerUnit: 2, available: 10 },
  { sku: "Screw pack", quantityPerUnit: 4, available: 12 },
];

const BANDS = [
  "Within the trading centre",
  "Within Kampala",
  "Outside Kampala",
];

export function Wave3Preview() {
  const [units, setUnits] = useState(3);
  const [serial, setSerial] = useState("ABC12345");
  const [band, setBand] = useState<string>(BANDS[1]);

  const requirements = explodeBom(BOM, units);
  const quote = deliveryQuote(band);
  const expiry = warrantyExpiry("2026-11-25", 12);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight">Wave 3 preview</h1>
        <StatusBadge state="soon" />
      </header>
      <p className="text-sm text-ink/60">
        These helpers are built and tested but are not enabled in the till yet. They do
        not create production runs, warranties or deliveries.
      </p>

      <section className="card">
        <h2 className="text-base font-bold">Factories · bill of materials</h2>
        <label className="mt-3 block text-sm">
          Units to make
          <input
            type="number"
            min={1}
            value={units}
            onChange={(event) => setUnits(parseInt(event.target.value, 10) || 1)}
            className="mt-1 w-full rounded-xl border border-black/15 px-4 py-3"
          />
        </label>
        <p className="mt-3 text-sm text-ink/60">
          Batch {productionBatchCode(new Date("2026-11-25"), 1)}
        </p>
        <ul className="mt-2 space-y-1 text-sm text-ink/60">
          {requirements.map((item) => (
            <li key={item.sku}>
              {item.sku}: need {item.required}, have {item.available}
              {item.shortfall > 0 ? ` · short ${item.shortfall}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="text-base font-bold">Electrical & furniture · serials</h2>
        <label className="mt-3 block text-sm">
          Serial number
          <input
            value={serial}
            onChange={(event) => setSerial(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/15 px-4 py-3"
          />
        </label>
        <p className="mt-3 text-sm text-ink/60">
          {validateSerial(serial) ? "Valid serial" : "Invalid serial"} · 12-month
          warranty ends {expiry} · {underWarranty(expiry) ? "in warranty" : "expired"}
        </p>
      </section>

      <section className="card">
        <h2 className="text-base font-bold">Delivery quote</h2>
        <label className="mt-3 block text-sm">
          Area
          <select
            value={band}
            onChange={(event) => setBand(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3"
          >
            {BANDS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-sm text-ink/60">
          Fee UGX {quote.fee.toLocaleString()} · about {quote.etaDays} day
          {quote.etaDays === 1 ? "" : "s"} · next state after booked:{" "}
          {nextDeliveryState("booked")}
        </p>
      </section>

      <Link href="/app/verticals" className="btn-secondary">
        Back to business types
      </Link>
    </div>
  );
}
