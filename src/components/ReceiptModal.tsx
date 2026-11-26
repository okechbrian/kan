"use client";

import { Printer, X } from "lucide-react";
import { KanLogo } from "./brand/KanLogo";
import { ugx } from "../lib/money";

export interface ReceiptLine {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface ReceiptTender {
  method: string;
  amount: number;
}

export interface ReceiptData {
  saleId: string;
  shopName: string;
  createdAt: string;
  lines: ReceiptLine[];
  tenders: ReceiptTender[];
  total: number;
  status?: string;
}

const TENDER_LABELS: Record<string, string> = {
  cash: "Cash",
  mtn_momo: "MTN MoMo",
  airtel_money: "Airtel Money",
  credit: "Credit (Deni)",
};

/**
 * 80mm thermal-ready receipt preview & print modal.
 * Uses the solid black Kan wordmark per Brand Guidelines v1.0 (min 24mm print).
 */
export function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-kan-navy/60 p-4 backdrop-blur-[1px] print:static print:bg-white print:p-0">
      <div className="w-full max-w-[340px] rounded-2xl bg-white p-5 text-black shadow-2xl print:max-w-[80mm] print:rounded-none print:p-2 print:shadow-none">
        <div className="mb-3 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold uppercase tracking-wide text-kan-navy/60">
            Receipt preview (80mm)
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="rounded-lg p-1 text-kan-navy/70 hover:bg-kan-navy/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-y border-dashed border-black/40 py-3 text-center">
          <KanLogo
            variant="black"
            className="mx-auto mb-1.5 h-6 w-auto min-w-[80px]"
          />
          <p className="text-sm font-bold">{receipt.shopName || "Kan Shop"}</p>
          <p className="text-[11px] text-black/70">
            {receipt.createdAt.slice(0, 16).replace("T", " ")} · #
            {receipt.saleId.slice(0, 8).toUpperCase()}
          </p>
          {receipt.status === "voided" && (
            <p className="mt-1 text-xs font-bold uppercase">*** VOIDED ***</p>
          )}
        </div>

        <div className="my-3 space-y-1.5 text-xs">
          {receipt.lines.map((line, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{line.name}</p>
                <p className="ugx-amount text-[11px] text-black/70">
                  {line.qty} × {ugx(line.unitPrice)}
                </p>
              </div>
              <span className="ugx-amount font-bold">
                {ugx(line.qty * line.unitPrice)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black/40 pt-2.5">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span className="ugx-amount">{ugx(receipt.total)}</span>
          </div>
          {receipt.tenders.length > 0 && (
            <div className="mt-1.5 space-y-0.5 text-[11px] text-black/80">
              {receipt.tenders.map((t, i) => (
                <div key={i} className="flex justify-between">
                  <span>{TENDER_LABELS[t.method] ?? t.method}</span>
                  <span className="ugx-amount">{ugx(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-black/70">
          Thank you for shopping with us · Powered by Kan (Pwata Inc)
        </p>

        <div className="mt-4 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-kan-navy py-2.5 text-sm font-bold text-kan-white"
          >
            <Printer className="h-4 w-4 text-kan-teal" />
            Print receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-kan-navy/20 px-4 py-2.5 text-sm font-semibold text-kan-navy"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
