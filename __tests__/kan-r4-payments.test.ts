import { describe, it, expect } from "vitest";
import {
  confirmPayment,
  ADAPTERS,
  MANUAL_METHODS,
} from "../src/lib/payments/adapters";
import { planSplit, finaliseSplit } from "../src/lib/payments/split";
import { reconcileByMethod, cashInTill } from "../src/lib/payments/reconcile";

describe("Kan R4 — manual payment adapters", () => {
  it("confirms cash and computes change with integers", () => {
    const result = confirmPayment("cash", { amount: 18500, amountTendered: 20000 });
    expect(result).toMatchObject({ ok: true, amount: 18500, change: 1500 });
  });

  it("refuses short cash and floating amounts", () => {
    expect(confirmPayment("cash", { amount: 5000, amountTendered: 4000 })).toMatchObject({
      ok: false,
      error: "insufficient_cash",
    });
    expect(confirmPayment("cash", { amount: 10.5 })).toMatchObject({
      ok: false,
      error: "invalid_amount",
    });
  });

  it("requires explicit MoMo confirmation", () => {
    expect(confirmPayment("mtn_momo", { amount: 5000 })).toMatchObject({
      ok: false,
      error: "confirmation_required",
    });
    const ok = confirmPayment("mtn_momo", {
      amount: 5000,
      confirmed: true,
      reference: "  TX123  ",
    });
    expect(ok).toMatchObject({ ok: true, reference: "TX123" });
    expect(confirmPayment("airtel_money", { amount: 5000, confirmed: true }).ok).toBe(true);
  });

  it("requires a customer for credit", () => {
    expect(confirmPayment("credit", { amount: 5000 })).toMatchObject({
      ok: false,
      error: "customer_required",
    });
    expect(
      confirmPayment("credit", { amount: 5000, customerId: "c1" }).ok
    ).toBe(true);
  });

  it("does not pretend gateways are configured", () => {
    for (const method of ["bank_transfer", "card", "gift_card", "crypto"] as const) {
      expect(ADAPTERS[method].kind).toBe("gateway");
      expect(confirmPayment(method, { amount: 1000 })).toMatchObject({
        ok: false,
        error: "gateway_not_configured",
      });
    }
    expect(MANUAL_METHODS).toHaveLength(4);
  });
});

describe("Kan R4 — split payments", () => {
  it("allows a partial split with a remaining amount", () => {
    const plan = planSplit(15000, [
      { method: "cash", amount: 10000 },
      { method: "mtn_momo", amount: 3000 },
    ]);
    expect(plan.ok).toBe(true);
    if (plan.ok) expect(plan.remaining).toBe(2000);
  });

  it("requires tenders to sum exactly at finalisation", () => {
    const tenders = [
      { method: "cash" as const, amount: 10000 },
      { method: "mtn_momo" as const, amount: 4000 },
    ];
    expect(finaliseSplit(15000, tenders)).toMatchObject({
      ok: false,
      error: "tenders_must_sum_to_total",
    });
    expect(finaliseSplit(14000, tenders).ok).toBe(true);
  });

  it("requires a customer for a credit tender", () => {
    expect(
      planSplit(5000, [{ method: "credit", amount: 5000 }])
    ).toMatchObject({ ok: false, error: "customer_required_for_credit" });
  });

  it("rejects tenders above the total", () => {
    expect(
      planSplit(5000, [{ method: "cash", amount: 6000 }])
    ).toMatchObject({ ok: false, error: "tenders_exceed_total" });
  });
});

describe("Kan R4 — reconciliation", () => {
  it("reports matched, short and over by method", () => {
    const rows = reconcileByMethod(
      [
        { method: "cash", amount: 10000 },
        { method: "mtn_momo", amount: 5000 },
      ],
      [
        { method: "cash", amount: 10000 },
        { method: "mtn_momo", amount: 4000 },
        { method: "airtel_money", amount: 2000 },
      ]
    );
    expect(rows.find((row) => row.method === "cash")?.status).toBe("matched");
    expect(rows.find((row) => row.method === "mtn_momo")?.status).toBe("short");
    expect(rows.find((row) => row.method === "airtel_money")?.status).toBe("over");
    expect(cashInTill(rows)).toBe(10000);
  });
});
