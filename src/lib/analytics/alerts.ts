import { expiryStatus, type ExpiryStatus } from "../commerce/inventory";

export type ProductLike = {
  id: string;
  name: string;
  stock_qty: number;
  reorder_level?: number;
};

export type BatchLike = {
  id: string;
  productId: string;
  quantity: number;
  expiryDate: string | null;
};

export type CustomerLike = {
  id: string;
  name: string;
  balance: number;
  lastActivity?: string | null;
};

export type StockAlert = {
  productId: string;
  name: string;
  quantity: number;
  level: "out" | "low";
};

export function stockAlerts(products: ProductLike[]): StockAlert[] {
  return products
    .map((product) => {
      const reorder = product.reorder_level ?? 5;
      return {
        productId: product.id,
        name: product.name,
        quantity: product.stock_qty,
        level: (product.stock_qty <= 0 ? "out" : "low") as "out" | "low",
      };
    })
    .filter((alert) => alert.quantity <= (products.find((p) => p.id === alert.productId)?.reorder_level ?? 5));
}

export type ExpiryAlert = {
  batchId: string;
  productId: string;
  quantity: number;
  expiryDate: string;
  status: ExpiryStatus;
};

export function expiryAlerts(batches: BatchLike[], today = new Date()): ExpiryAlert[] {
  return batches
    .filter((batch) => batch.expiryDate !== null)
    .map((batch) => ({
      batchId: batch.id,
      productId: batch.productId,
      quantity: batch.quantity,
      expiryDate: batch.expiryDate as string,
      status: expiryStatus(batch.expiryDate, today),
    }))
    .filter((alert) => alert.status === "expired" || alert.status === "expiring");
}

export type DeniAlert = {
  customerId: string;
  name: string;
  balance: number;
  daysSinceActivity: number;
};

export function deniAlerts(customers: CustomerLike[], staleDays = 7, today = new Date()) {
  return customers
    .filter((customer) => customer.balance > 0)
    .map((customer) => {
      const last = customer.lastActivity ? new Date(customer.lastActivity) : today;
      const days = Math.max(0, Math.floor((today.getTime() - last.getTime()) / 86400000));
      return {
        customerId: customer.id,
        name: customer.name,
        balance: customer.balance,
        daysSinceActivity: days,
      };
    })
    .filter((alert) => alert.daysSinceActivity >= staleDays);
}

export function alertCounts(input: {
  products: ProductLike[];
  batches: BatchLike[];
  customers: CustomerLike[];
}) {
  return {
    stock: stockAlerts(input.products).length,
    expiry: expiryAlerts(input.batches).length,
    deni: deniAlerts(input.customers).length,
  };
}
