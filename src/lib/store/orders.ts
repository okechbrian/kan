import type { CartTotals } from "./cart";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "in_transit",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["in_transit", "cancelled"],
  in_transit: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return TRANSITIONS[from].includes(to);
}

export function nextStatus(from: OrderStatus) {
  return TRANSITIONS[from][0] ?? null;
}

export function buildOrder(input: {
  shopId: string;
  slug: string;
  customerPhone: string;
  bandName: string;
  totals: CartTotals;
}) {
  const phone = input.customerPhone.replace(/[^\d+]/g, "");
  if (!/^(?:\+?2567\d{8}|07\d{8})$/.test(phone)) {
    throw new Error("invalid_phone");
  }
  if (input.totals.lines.length === 0) throw new Error("empty_cart");
  return {
    shop_id: input.shopId,
    slug: input.slug,
    customer_phone: phone,
    delivery_band: input.bandName,
    delivery_fee: input.totals.delivery,
    subtotal: input.totals.subtotal,
    total: input.totals.total,
    status: "pending" as OrderStatus,
    items: input.totals.lines,
  };
}

export function invoiceText(order: {
  slug: string;
  customer_phone: string;
  delivery_band: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}) {
  const ugx = (amount: number) => {
    if (!Number.isInteger(amount)) throw new Error("UGX amounts must be integers");
    return `UGX ${Math.abs(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };
  return [
    `Invoice - ${order.slug}`,
    `Customer: ${order.customer_phone}`,
    `Delivery: ${order.delivery_band}`,
    "-".repeat(28),
    ...order.items.map(
      (item) => `${item.name} x${item.quantity}  ${ugx(item.lineTotal)}`
    ),
    "-".repeat(28),
    `Subtotal ${ugx(order.subtotal)}`,
    `Delivery ${ugx(order.delivery_fee)}`,
    `TOTAL ${ugx(order.total)}`,
  ].join("\n");
}
