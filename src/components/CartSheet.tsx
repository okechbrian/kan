"use client";

import { Minus, Plus, X } from "lucide-react";
import { ugx } from "../lib/money";

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
}

interface CartSheetProps {
  lines: CartLine[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onCharge: () => void;
}

export function CartSheet({
  lines,
  onUpdateQty,
  onRemove,
  onCharge,
}: CartSheetProps) {
  if (lines.length === 0) return null;

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  return (
    <div className="fixed bottom-14 left-0 right-0 z-30 border-t border-kan-navy/15 bg-white shadow-xl print:hidden">
      <div className="mx-auto max-w-[420px] p-3">
        <div className="mb-2 max-h-48 overflow-y-auto divide-y divide-kan-navy/10">
          {lines.map((line) => (
            <div
              key={line.productId}
              className="flex items-center justify-between py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-kan-navy">
                  {line.name}
                </p>
                <p className="ugx-amount text-xs text-kan-navy/60">
                  {ugx(line.unitPrice)}
                </p>
              </div>
              <div className="ml-2 flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Decrease ${line.name}`}
                  onClick={() => onUpdateQty(line.productId, line.qty - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-kan-navy/10 text-kan-navy active:bg-kan-navy/20"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="ugx-amount w-7 text-center text-sm font-bold text-kan-navy">
                  {line.qty}
                </span>
                <button
                  type="button"
                  aria-label={`Increase ${line.name}`}
                  onClick={() => onUpdateQty(line.productId, line.qty + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-kan-navy/10 text-kan-navy active:bg-kan-navy/20"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${line.name}`}
                  onClick={() => onRemove(line.productId)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-kan-guava/20 text-kan-navy active:bg-kan-guava/40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-2.5 flex items-center justify-between border-t border-kan-navy/10 pt-2">
          <span className="text-sm font-semibold text-kan-navy/70">Total</span>
          <span className="ugx-amount text-lg font-bold text-kan-navy">
            {ugx(total)}
          </span>
        </div>

        <button
          type="button"
          onClick={onCharge}
          className="ugx-amount min-h-[48px] w-full rounded-xl bg-kan-navy py-3 text-base font-bold text-kan-white shadow-sm active:opacity-90"
        >
          Charge <span className="text-kan-teal">{ugx(total)}</span>
        </button>
      </div>
    </div>
  );
}
