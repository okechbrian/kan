"use client";

import { useState } from "react";
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
    <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md p-4 pb-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Payment</h2>
          <button onClick={onCancel} className="text-gray-500 text-sm">
            Cancel
          </button>
        </div>

        <div className="text-center mb-3">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{ugx(total)}</p>
        </div>

        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md py-2 text-[11px] font-medium ${
                tab === t.key ? "bg-white shadow text-blue-700" : "text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {needsCustomer && (
          <div className="mb-3">
            {customer ? (
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{customer.name}</p>
                  <button
                    onClick={() => setShowPicker(true)}
                    className="text-xs text-red-600 underline"
                  >
                    Change
                  </button>
                </div>
                {customer.balance > 0 && (
                  <p className="text-xs text-orange-700 mt-1">
                    This person already owes {ugx(customer.balance)}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowPicker(true)}
                className="w-full rounded-lg border-2 border-dashed border-orange-300 p-3 text-orange-700 font-medium text-sm active:bg-orange-50"
              >
                Pick customer for credit
              </button>
            )}
          </div>
        )}

        {tab === "cash" && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-center outline-none focus:border-blue-500"
            />
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() =>
                    setCashTendered(chip === 0 ? total : chip)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                    (chip === 0 && cashTendered === total) ||
                    cashTendered === chip
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  }`}
                >
                  {chip === 0 ? "Exact" : ugx(chip)}
                </button>
              ))}
            </div>
            {cashOk && (
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">Change</p>
                <p className="text-xl font-bold text-green-700">
                  {cashChange === 0 ? "No change" : ugx(cashChange)}
                </p>
              </div>
            )}
            <button
              onClick={confirmCash}
              disabled={!cashOk || confirming}
              className="w-full rounded-lg bg-green-600 py-3 text-white text-lg font-semibold disabled:opacity-50 disabled:bg-gray-300"
            >
              {confirming ? "Recording..." : "Record cash sale"}
            </button>
          </>
        )}

        {(tab === "mtn_momo" || tab === "airtel_money") && (
          <>
            {momoNumber ? (
              <div className="bg-blue-50 rounded-lg p-3 mb-4 text-center">
                <p className="text-xs text-blue-600 font-medium">Send to</p>
                <p className="text-lg font-bold text-blue-800">{momoNumber}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center mb-4">
                No shop MoMo number set. Confirm when the money has arrived.
              </p>
            )}
            <button
              onClick={() => confirmMomo(tab)}
              disabled={confirming}
              className="w-full rounded-lg bg-green-600 py-3 text-white text-lg font-semibold disabled:opacity-50"
            >
              {confirming ? "Recording..." : "I received MoMo"}
            </button>
          </>
        )}

        {tab === "credit" && (
          <button
            onClick={confirmCredit}
            disabled={!customer || confirming}
            className="w-full rounded-lg bg-orange-600 py-3 text-white text-lg font-semibold disabled:opacity-50 disabled:bg-gray-300"
          >
            {confirming ? "Recording..." : "Put on deni"}
          </button>
        )}

        {tab === "split" && (
          <>
            <p className="text-sm text-center text-gray-500 mb-3">
              Remaining {ugx(remaining)}
            </p>
            {remaining > 0 && (
              <>
                <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-1">
                  {SPLIT_METHODS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setSplitMethod(m.key)}
                      className={`flex-1 rounded-md py-1.5 text-[11px] font-medium ${
                        splitMethod === m.key
                          ? "bg-white shadow text-blue-700"
                          : "text-gray-600"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {(splitMethod === "mtn_momo" ||
                  splitMethod === "airtel_money") &&
                  momoNumber && (
                    <p className="text-xs text-center text-blue-700 mb-2">
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center mb-2 outline-none focus:border-blue-500"
                />
                <button
                  onClick={addSplitTender}
                  disabled={
                    remaining <= 0 ||
                    splitAmount <= 0 ||
                    (splitMethod === "credit" && !customer)
                  }
                  className="w-full rounded-lg border border-blue-300 py-2 text-blue-700 text-sm font-medium mb-3 disabled:opacity-40"
                >
                  + Add{" "}
                  {SPLIT_METHODS.find((m) => m.key === splitMethod)?.label}{" "}
                  {ugx(Math.min(splitAmount, remaining))}
                </button>
              </>
            )}
            {splitTenders.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {splitTenders.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm font-medium">
                      {SPLIT_METHODS.find((m) => m.key === t.method)?.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{ugx(t.amount)}</span>
                      <button
                        onClick={() => removeSplit(i)}
                        className="text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={confirmSplit}
              disabled={
                remaining !== 0 ||
                confirming ||
                (splitTenders.some((t) => t.method === "credit") && !customer)
              }
              className="w-full rounded-lg bg-green-600 py-3 text-white text-lg font-semibold disabled:opacity-50 disabled:bg-gray-300"
            >
              {confirming ? "Recording..." : "Record sale"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
