"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ugx } from "../lib/money";
import { CustomerPicker } from "./CustomerPicker";
import type { Customer } from "../lib/db";

export type PayTender = {
  method: "cash" | "mtn_momo" | "airtel_money" | "credit";
  amount: number;
  amountTendered?: number;
};

type Tab = "cash" | "mtn_momo" | "airtel_money" | "credit" | "split";
type SplitMethod = "cash" | "mtn_momo" | "airtel_money" | "credit";

interface PayModalProps {
  total: number;
  momoNumber?: string;
  onConfirm: (tenders: PayTender[], customerId?: string | null) => void;
  onCancel: () => void;
  confirming?: boolean;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "mtn_momo", label: "MTN" },
  { key: "airtel_money", label: "Airtel" },
  { key: "credit", label: "Credit" },
  { key: "split", label: "Split" },
];

const SPLIT_METHODS: { key: SplitMethod; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "mtn_momo", label: "MTN" },
  { key: "airtel_money", label: "Airtel" },
  { key: "credit", label: "Credit" },
];

const QUICK_CHIPS = [0, 1000, 5000, 10000, 20000, 50000];

export function PayModal({
  total,
  momoNumber,
  onConfirm,
  onCancel,
  confirming,
}: PayModalProps) {
  const [tab, setTab] = useState<Tab>("cash");
  const [cashTendered, setCashTendered] = useState(total);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [splitTenders, setSplitTenders] = useState<PayTender[]>([]);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("cash");
  const [splitAmount, setSplitAmount] = useState(total);

  const splitPaid = splitTenders.reduce((s, t) => s + t.amount, 0);
  const remaining = total - splitPaid;
  const needsCustomer =
    tab === "credit" ||
    (tab === "split" &&
      (splitMethod === "credit" ||
        splitTenders.some((t) => t.method === "credit")));

  const cashChange = cashTendered - total;
  const cashOk = cashTendered >= total;

  const confirmCash = () => {
    if (!cashOk || confirming) return;
    onConfirm(
      [{ method: "cash", amount: total, amountTendered: cashTendered }],
      null
    );
  };

  const confirmMomo = (method: "mtn_momo" | "airtel_money") => {
    if (confirming) return;
    onConfirm([{ method, amount: total }], null);
  };

  const confirmCredit = () => {
    if (!customer || confirming) return;
    onConfirm([{ method: "credit", amount: total }], customer.id);
  };

  const addSplitTender = () => {
    const amount = Math.min(splitAmount, remaining);
    if (amount <= 0) return;
    if (splitMethod === "credit" && !customer) return;
    setSplitTenders((prev) => [...prev, { method: splitMethod, amount }]);
    const nextRemaining = remaining - amount;
    setSplitAmount(nextRemaining);
  };

  const removeSplit = (index: number) => {
    setSplitTenders((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const paid = next.reduce((s, t) => s + t.amount, 0);
      setSplitAmount(total - paid);
      return next;
    });
  };

  const confirmSplit = () => {
    if (remaining !== 0 || confirming) return;
    if (splitTenders.some((t) => t.method === "credit") && !customer) return;
    onConfirm(splitTenders, customer?.id ?? null);
  };

  if (showPicker) {
    return (
      <CustomerPicker
        onSelect={(c) => {
          setCustomer(c);
          setShowPicker(false);
        }}
        onCancel={() => setShowPicker(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-kan-navy/60 backdrop-blur-[1px]">
      <div className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-t-2xl bg-kan-white p-4 pb-8 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-kan-navy">Payment</h2>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[36px] rounded-lg px-2 text-sm font-semibold text-kan-navy/65 hover:text-kan-navy"
          >
            Cancel
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-kan-navy px-4 py-3 text-center text-kan-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-kan-white/70">
            Total due
          </p>
          <p className="ugx-amount text-2xl font-bold text-kan-teal">
            {ugx(total)}
          </p>
        </div>

        <div className="mb-4 flex gap-1 rounded-xl bg-kan-navy/10 p-1">
          {TABS.map((t) => (
            <button
              type="button"
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`min-h-[38px] flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
                tab === t.key
                  ? "bg-kan-navy text-kan-white shadow-sm"
                  : "text-kan-navy/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {needsCustomer && (
          <div className="mb-3">
            {customer ? (
              <div className="rounded-xl border border-kan-guava/50 bg-kan-guava/15 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-kan-navy">
                    {customer.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="text-xs font-bold text-kan-navy underline"
                  >
                    Change
                  </button>
                </div>
                {customer.balance > 0 && (
                  <p className="ugx-amount mt-1 text-xs font-semibold text-kan-navy/80">
                    This person already owes {ugx(customer.balance)}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="min-h-[44px] w-full rounded-xl border-2 border-dashed border-kan-guava bg-kan-guava/10 p-3 text-sm font-bold text-kan-navy active:bg-kan-guava/20"
              >
                Pick customer for credit
              </button>
            )}
          </div>
        )}

        {tab === "cash" && (
          <>
            <label className="mb-1 block text-sm font-semibold text-kan-navy">
              Amount tendered
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cashTendered}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setCashTendered(parseInt(raw, 10) || 0);
              }}
              className="ugx-amount w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-3 text-center text-lg font-bold text-kan-navy outline-none focus:border-kan-navy"
            />
            <div className="mt-2.5 mb-4 flex flex-wrap gap-2">
              {QUICK_CHIPS.map((chip) => {
                const active =
                  (chip === 0 && cashTendered === total) ||
                  cashTendered === chip;
                return (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => setCashTendered(chip === 0 ? total : chip)}
                    className={`ugx-amount min-h-[36px] rounded-full border px-3 py-1.5 text-xs font-bold ${
                      active
                        ? "border-kan-navy bg-kan-navy text-kan-white"
                        : "border-kan-navy/20 bg-white text-kan-navy"
                    }`}
                  >
                    {chip === 0 ? "Exact" : ugx(chip)}
                  </button>
                );
              })}
            </div>
            {cashOk && (
              <div className="mb-4 rounded-xl bg-kan-teal/20 p-3 text-center">
                <p className="text-xs font-semibold text-kan-navy/70">Change</p>
                <p className="ugx-amount text-xl font-bold text-kan-navy">
                  {cashChange === 0 ? "No change" : ugx(cashChange)}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={confirmCash}
              disabled={!cashOk || confirming}
              className="min-h-[48px] w-full rounded-xl bg-kan-navy py-3 text-base font-bold text-kan-white disabled:bg-kan-navy/25"
            >
              {confirming ? "Recording..." : "Record cash sale"}
            </button>
          </>
        )}

        {(tab === "mtn_momo" || tab === "airtel_money") && (
          <>
            {momoNumber ? (
              <div className="mb-4 rounded-xl border border-kan-teal/50 bg-kan-teal/15 p-3 text-center">
                <p className="text-xs font-semibold text-kan-navy/70">
                  Send to ({tab === "mtn_momo" ? "MTN MoMo" : "Airtel Money"})
                </p>
                <p className="ugx-amount text-lg font-bold text-kan-navy">
                  {momoNumber}
                </p>
              </div>
            ) : (
              <p className="mb-4 text-center text-sm text-kan-navy/65">
                No shop MoMo number set. Confirm when the money has arrived.
              </p>
            )}
            <button
              type="button"
              onClick={() => confirmMomo(tab)}
              disabled={confirming}
              className="min-h-[48px] w-full rounded-xl bg-kan-navy py-3 text-base font-bold text-kan-white disabled:opacity-50"
            >
              {confirming ? "Recording..." : "I received MoMo"}
            </button>
          </>
        )}

        {tab === "credit" && (
          <button
            type="button"
            onClick={confirmCredit}
            disabled={!customer || confirming}
            className="min-h-[48px] w-full rounded-xl bg-kan-guava py-3 text-base font-bold text-kan-navy disabled:bg-kan-navy/20 disabled:text-kan-navy/50"
          >
            {confirming ? "Recording..." : "Put on deni"}
          </button>
        )}

        {tab === "split" && (
          <>
            <p className="ugx-amount mb-3 text-center text-sm font-semibold text-kan-navy/70">
              Remaining {ugx(remaining)}
            </p>
            {remaining > 0 && (
              <>
                <div className="mb-2 flex gap-1 rounded-xl bg-kan-navy/10 p-1">
                  {SPLIT_METHODS.map((m) => (
                    <button
                      type="button"
                      key={m.key}
                      onClick={() => setSplitMethod(m.key)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${
                        splitMethod === m.key
                          ? "bg-kan-navy text-kan-white shadow-sm"
                          : "text-kan-navy/70"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {(splitMethod === "mtn_momo" ||
                  splitMethod === "airtel_money") &&
                  momoNumber && (
                    <p className="ugx-amount mb-2 text-center text-xs font-semibold text-kan-navy">
                      Send {ugx(Math.min(splitAmount, remaining))} to{" "}
                      {momoNumber}
                    </p>
                  )}
                <input
                  type="text"
                  inputMode="numeric"
                  value={splitAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setSplitAmount(
                      Math.min(parseInt(raw, 10) || 0, remaining)
                    );
                  }}
                  className="ugx-amount mb-2 w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 text-center font-bold text-kan-navy outline-none focus:border-kan-navy"
                />
                <button
                  type="button"
                  onClick={addSplitTender}
                  disabled={
                    remaining <= 0 ||
                    splitAmount <= 0 ||
                    (splitMethod === "credit" && !customer)
                  }
                  className="ugx-amount mb-3 min-h-[42px] w-full rounded-xl border border-kan-navy/25 bg-white py-2 text-sm font-bold text-kan-navy disabled:opacity-40"
                >
                  + Add{" "}
                  {SPLIT_METHODS.find((m) => m.key === splitMethod)?.label}{" "}
                  {ugx(Math.min(splitAmount, remaining))}
                </button>
              </>
            )}
            {splitTenders.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {splitTenders.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-kan-navy/10 bg-white px-3 py-2"
                  >
                    <span className="text-sm font-semibold text-kan-navy">
                      {SPLIT_METHODS.find((m) => m.key === t.method)?.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="ugx-amount text-sm font-bold text-kan-navy">
                        {ugx(t.amount)}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove tender"
                        onClick={() => removeSplit(i)}
                        className="rounded p-1 text-kan-navy/60 hover:text-kan-navy"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={confirmSplit}
              disabled={
                remaining !== 0 ||
                confirming ||
                (splitTenders.some((t) => t.method === "credit") && !customer)
              }
              className="min-h-[48px] w-full rounded-xl bg-kan-navy py-3 text-base font-bold text-kan-white disabled:bg-kan-navy/25"
            >
              {confirming ? "Recording..." : "Record sale"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
