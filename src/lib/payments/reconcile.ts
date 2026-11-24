import type { PaymentMethod } from "./adapters";

export type MethodTotal = { method: PaymentMethod; amount: number };

export type ReconciliationRow = {
  method: PaymentMethod;
  expected: number;
  recorded: number;
  difference: number;
  status: "matched" | "short" | "over";
};

export function reconcileByMethod(expected: MethodTotal[], recorded: MethodTotal[]) {
  const methods = Array.from(
    new Set<PaymentMethod>([
      ...expected.map((item) => item.method),
      ...recorded.map((item) => item.method),
    ])
  );
  return methods.map<ReconciliationRow>((method) => {
    const expectedAmount = expected
      .filter((item) => item.method === method)
      .reduce((sum, item) => sum + item.amount, 0);
    const recordedAmount = recorded
      .filter((item) => item.method === method)
      .reduce((sum, item) => sum + item.amount, 0);
    const difference = recordedAmount - expectedAmount;
    return {
      method,
      expected: expectedAmount,
      recorded: recordedAmount,
      difference,
      status: difference === 0 ? "matched" : difference > 0 ? "over" : "short",
    };
  });
}

export function cashInTill(
  rows: ReconciliationRow[]
) {
  const cash = rows.find((row) => row.method === "cash");
  return cash?.recorded ?? 0;
}
