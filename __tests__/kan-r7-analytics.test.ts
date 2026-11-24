import { describe, it, expect } from "vitest";
import {
  completedSales,
  salesByDay,
  methodTotals,
  averageBasket,
  productPerformance,
  profitEstimate,
  type SaleLike,
} from "../src/lib/analytics/sales";
import {
  stockAlerts,
  expiryAlerts,
  deniAlerts,
  alertCounts,
} from "../src/lib/analytics/alerts";
import { dailyReport, validateFrequency } from "../src/lib/analytics/report";

const sales: SaleLike[] = [
  {
    id: "s1",
    created_at: "2026-11-24T09:00:00Z",
    status: "completed",
    total: 10000,
    tenders: [
      { method: "cash", amount: 6000 },
      { method: "mtn_momo", amount: 4000 },
    ],
    lines: [
      {
        productId: "p1",
        name: "Sugar 1kg",
        qty: 2,
        unitPrice: 5000,
        buyingPriceSnapshot: 4200,
        lineTotal: 10000,
      },
    ],
  },
  {
    id: "s2",
    created_at: "2026-11-24T15:00:00Z",
    status: "completed",
    total: 3500,
    tenders: [{ method: "cash", amount: 3500 }],
    lines: [
      {
        productId: "p2",
        name: "Soap",
        qty: 1,
        unitPrice: 3500,
        buyingPriceSnapshot: 2500,
        lineTotal: 3500,
      },
    ],
  },
  {
    id: "s3",
    created_at: "2026-11-24T16:00:00Z",
    status: "voided",
    total: 5000,
    tenders: [{ method: "cash", amount: 5000 }],
    lines: [],
  },
];

describe("Kan R7 — sales analytics", () => {
  it("ignores voided sales and respects date windows", () => {
    expect(completedSales(sales)).toHaveLength(2);
    expect(
      completedSales(sales, new Date("2026-11-24T12:00:00Z")).map((sale) => sale.id)
    ).toEqual(["s2"]);
  });

  it("groups by day, method and basket with integer money", () => {
    expect(salesByDay(sales)).toEqual([{ day: "2026-11-24", total: 13500, count: 2 }]);
    expect(methodTotals(sales)).toEqual([
      { method: "cash", amount: 9500 },
      { method: "mtn_momo", amount: 4000 },
    ]);
    expect(averageBasket(sales)).toBe(6750);
  });

  it("computes product profit from the buying-price snapshot", () => {
    const rows = productPerformance(sales);
    expect(rows[0]).toMatchObject({ productId: "p1", revenue: 10000, profit: 1600 });
    expect(profitEstimate(sales, 1000)).toBe(1600);
  });
});

describe("Kan R7 — alerts", () => {
  const products = [
    { id: "p1", name: "Sugar", stock_qty: 0 },
    { id: "p2", name: "Soap", stock_qty: 4, reorder_level: 5 },
    { id: "p3", name: "Rice", stock_qty: 20 },
  ];

  it("flags out and low stock", () => {
    const alerts = stockAlerts(products);
    expect(alerts.find((alert) => alert.productId === "p1")?.level).toBe("out");
    expect(alerts.find((alert) => alert.productId === "p2")?.level).toBe("low");
    expect(alerts).toHaveLength(2);
  });

  it("flags expired and expiring batches", () => {
    const today = new Date("2026-11-24T00:00:00Z");
    const alerts = expiryAlerts(
      [
        { id: "b1", productId: "p1", quantity: 2, expiryDate: "2026-11-20" },
        { id: "b2", productId: "p1", quantity: 3, expiryDate: "2026-12-01" },
        { id: "b3", productId: "p1", quantity: 5, expiryDate: "2027-01-01" },
      ],
      today
    );
    expect(alerts.map((alert) => alert.status)).toEqual(["expired", "expiring"]);
  });

  it("flags stale deni balances", () => {
    const today = new Date("2026-11-24T00:00:00Z");
    const alerts = deniAlerts(
      [
        { id: "c1", name: "Aisha", balance: 5000, lastActivity: "2026-11-01T00:00:00Z" },
        { id: "c2", name: "Maria", balance: 5000, lastActivity: "2026-11-23T00:00:00Z" },
        { id: "c3", name: "Zero", balance: 0 },
      ],
      7,
      today
    );
    expect(alerts.map((alert) => alert.customerId)).toEqual(["c1"]);
  });

  it("summarises counts", () => {
    expect(
      alertCounts({
        products,
        batches: [{ id: "b1", productId: "p1", quantity: 1, expiryDate: "2026-11-20" }],
        customers: [{ id: "c1", name: "A", balance: 1000, lastActivity: "2026-01-01" }],
      })
    ).toEqual({ stock: 2, expiry: 1, deni: 1 });
  });
});

describe("Kan R7 — reports", () => {
  it("validates a schedule frequency", () => {
    expect(validateFrequency("weekly")).toBe("weekly");
    expect(() => validateFrequency("hourly")).toThrow("invalid_frequency");
  });

  it("renders a daily report from fixtures", () => {
    const text = dailyReport({
      date: "2026-11-24",
      sales,
      stock: stockAlerts([
        { id: "p1", name: "Sugar", stock_qty: 0 },
      ]),
      expiry: [],
      expenses: 1000,
    });
    expect(text).toContain("UGX 13,500");
    expect(text).toContain("UGX 1,600");
    expect(text).toContain("Low/out of stock: 1");
  });
});
