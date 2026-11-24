export type PaymentMethod =
  | "cash"
  | "mtn_momo"
  | "airtel_money"
  | "credit"
  | "bank_transfer"
  | "card"
  | "gift_card"
  | "crypto";

export const MANUAL_METHODS: PaymentMethod[] = [
  "cash",
  "mtn_momo",
  "airtel_money",
  "credit",
];

export type ManualPaymentInput = {
  amount: number;
  amountTendered?: number;
  customerId?: string;
  reference?: string;
  confirmed?: boolean;
};

export type PaymentConfirmation =
  | { ok: true; method: PaymentMethod; amount: number; change: number; reference: string }
  | { ok: false; error: string };

export type PaymentAdapter = {
  method: PaymentMethod;
  kind: "manual" | "gateway";
  label: string;
  confirm(input: ManualPaymentInput): PaymentConfirmation;
};

function validAmount(amount: number) {
  return Number.isInteger(amount) && amount > 0;
}

export const cashAdapter: PaymentAdapter = {
  method: "cash",
  kind: "manual",
  label: "Cash",
  confirm(input) {
    if (!validAmount(input.amount)) return { ok: false, error: "invalid_amount" };
    const tendered = input.amountTendered ?? input.amount;
    if (!Number.isInteger(tendered) || tendered < input.amount) {
      return { ok: false, error: "insufficient_cash" };
    }
    return {
      ok: true,
      method: "cash",
      amount: input.amount,
      change: tendered - input.amount,
      reference: "",
    };
  },
};

function momoAdapter(method: "mtn_momo" | "airtel_money", label: string): PaymentAdapter {
  return {
    method,
    kind: "manual",
    label,
    confirm(input) {
      if (!validAmount(input.amount)) return { ok: false, error: "invalid_amount" };
      if (input.confirmed !== true) return { ok: false, error: "confirmation_required" };
      const reference = (input.reference ?? "").trim().slice(0, 64);
      return { ok: true, method, amount: input.amount, change: 0, reference };
    },
  };
}

export const mtnAdapter = momoAdapter("mtn_momo", "MTN MoMo");
export const airtelAdapter = momoAdapter("airtel_money", "Airtel Money");

export const creditAdapter: PaymentAdapter = {
  method: "credit",
  kind: "manual",
  label: "Credit (deni)",
  confirm(input) {
    if (!validAmount(input.amount)) return { ok: false, error: "invalid_amount" };
    if (!input.customerId) return { ok: false, error: "customer_required" };
    return {
      ok: true,
      method: "credit",
      amount: input.amount,
      change: 0,
      reference: input.customerId,
    };
  },
};

function gatewayAdapter(method: PaymentMethod, label: string): PaymentAdapter {
  return {
    method,
    kind: "gateway",
    label,
    confirm() {
      return { ok: false, error: "gateway_not_configured" };
    },
  };
}

export const ADAPTERS: Record<PaymentMethod, PaymentAdapter> = {
  cash: cashAdapter,
  mtn_momo: mtnAdapter,
  airtel_money: airtelAdapter,
  credit: creditAdapter,
  bank_transfer: gatewayAdapter("bank_transfer", "Bank transfer"),
  card: gatewayAdapter("card", "Card"),
  gift_card: gatewayAdapter("gift_card", "Gift card"),
  crypto: gatewayAdapter("crypto", "Crypto"),
};

export function confirmPayment(method: PaymentMethod, input: ManualPaymentInput) {
  const adapter = ADAPTERS[method];
  if (!adapter) return { ok: false, error: "unknown_method" } as PaymentConfirmation;
  return adapter.confirm(input);
}
