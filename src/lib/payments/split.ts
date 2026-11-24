import type { PaymentMethod } from "./adapters";

export type TenderInput = {
  method: PaymentMethod;
  amount: number;
  customerId?: string;
  reference?: string;
};

export type TenderPlan =
  | { ok: true; tenders: TenderInput[]; remaining: number }
  | { ok: false; error: string };

export function planSplit(total: number, tenders: TenderInput[]): TenderPlan {
  if (!Number.isInteger(total) || total <= 0) return { ok: false, error: "invalid_total" };
  if (!Array.isArray(tenders) || tenders.length === 0) {
    return { ok: false, error: "no_tenders" };
  }
  let sum = 0;
  for (const tender of tenders) {
    if (!Number.isInteger(tender.amount) || tender.amount <= 0) {
      return { ok: false, error: "invalid_tender_amount" };
    }
    if (tender.method === "credit" && !tender.customerId) {
      return { ok: false, error: "customer_required_for_credit" };
    }
    sum += tender.amount;
  }
  if (sum > total) return { ok: false, error: "tenders_exceed_total" };
  return { ok: true, tenders, remaining: total - sum };
}

export function finaliseSplit(total: number, tenders: TenderInput[]): TenderPlan {
  const plan = planSplit(total, tenders);
  if (!plan.ok) return plan;
  if (plan.remaining !== 0) return { ok: false, error: "tenders_must_sum_to_total" };
  return plan;
}
