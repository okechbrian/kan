import { describe, it, expect } from "vitest";
import { validateProduct, normaliseBarcode, isLowStock } from "../src/lib/commerce/catalogue";
import {
  expiryStatus,
  fifoAllocate,
  stockFromMovements,
  validateTransfer,
  applyTransfer,
  type Batch,
} from "../src/lib/commerce/inventory";
import { buildReceiptText, receiptTotals } from "../src/lib/commerce/receipt";
import { db } from "../src/lib/db";

describe("Kan R3 — catalogue", () => {
  it("validates a product with integer UGX prices", () => {
    const result = validateProduct({
      name: "Sugar 1kg",
      unit: "kg",
      sellingPrice: 5000,
      buyingPrice: 4200,
      barcode: " 590-1234567890 ",
      reorderLevel: 5,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.barcode).toBe("5901234567890");
      expect(result.value.reorderLevel).toBe(5);
    }
  });

  it("rejects floats, bad units and bad barcodes", () => {
    expect(
      validateProduct({ name: "x", unit: "kg", sellingPrice: 10.5, buyingPrice: 5 }).ok
    ).toBe(false);
    expect(
      validateProduct({ name: "x", unit: "crate", sellingPrice: 10, buyingPrice: 5 }).ok
    ).toBe(false);
    expect(() => normaliseBarcode("abc")).toThrow("invalid_barcode");
  });

  it("flags low stock at or below the reorder level", () => {
    expect(isLowStock(5, 5)).toBe(true);
    expect(isLowStock(6, 5)).toBe(false);
  });
});

describe("Kan R3 — inventory", () => {
  const batches: Batch[] = [
    { id: "b1", productId: "p1", quantity: 3, expiryDate: "2026-12-01", warehouseId: "w1" },
    { id: "b2", productId: "p1", quantity: 5, expiryDate: "2026-11-25", warehouseId: "w1" },
    { id: "b3", productId: "p1", quantity: 2, expiryDate: null, warehouseId: "w1" },
  ];

  it("classifies expiry", () => {
    const today = new Date("2026-11-24T00:00:00Z");
    expect(expiryStatus(null, today)).toBe("no_expiry");
    expect(expiryStatus("2026-11-20", today)).toBe("expired");
    expect(expiryStatus("2026-12-01", today)).toBe("expiring");
    expect(expiryStatus("2027-01-01", today)).toBe("ok");
  });

  it("allocates FIFO by expiry and reports shortfall without blocking", () => {
    const result = fifoAllocate(batches, 6);
    expect(result.allocations[0]).toEqual({ batchId: "b2", quantity: 5 });
    expect(result.allocations[1]).toEqual({ batchId: "b1", quantity: 1 });
    expect(result.shortfall).toBe(0);
    expect(fifoAllocate(batches, 20).shortfall).toBe(10);
  });

  it("recomputes stock from movements", () => {
    expect(stockFromMovements(10, [{ qty_delta: -2 }, { qty_delta: 5 }])).toBe(13);
  });

  it("validates transfers and never mixes a shop with itself", () => {
    expect(
      validateTransfer({ fromShopId: "a", toShopId: "a", lines: [{ productId: "p", quantity: 1 }] })
    ).toBe("same_shop");
    expect(
      validateTransfer({ fromShopId: "a", toShopId: "b", lines: [] })
    ).toBe("empty_lines");
    expect(
      validateTransfer({
        fromShopId: "a",
        toShopId: "b",
        lines: [{ productId: "p", quantity: 1 }, { productId: "p", quantity: 2 }],
      })
    ).toBe("duplicate_product");
    expect(
      validateTransfer({ fromShopId: "a", toShopId: "b", lines: [{ productId: "p", quantity: 1 }] })
    ).toBeNull();
  });

  it("moves stock both ways and warns on negative", () => {
    const result = applyTransfer(
      new Map([["p1", 1]]),
      new Map(),
      [{ productId: "p1", quantity: 3 }]
    );
    expect(result.from.get("p1")).toBe(-2);
    expect(result.to.get("p1")).toBe(3);
    expect(result.warnings).toHaveLength(1);
    expect(() =>
      applyTransfer(
        new Map([["p1", 1]]),
        new Map(),
        [{ productId: "p1", quantity: 3 }],
        false
      )
    ).toThrow("insufficient_stock");
  });
});

describe("Kan R3 — receipts", () => {
  it("builds a receipt only when tenders match the total", () => {
    const input = {
      shopName: "Nateete",
      saleId: "SL-1",
      createdAt: "2026-11-24 10:00",
      lines: [{ name: "Sugar 1kg", quantity: 2, lineTotal: 10000 }],
      total: 10000,
      tenders: [
        { method: "cash", amount: 6000 },
        { method: "mtn_momo", amount: 4000 },
      ],
    };
    expect(receiptTotals(input.lines, input.tenders)).toEqual({ lines: 10000, tenders: 10000 });
    const text = buildReceiptText(input);
    expect(text).toContain("UGX 10,000");
    expect(text).toContain("Sugar 1kg x2");
  });

  it("refuses a receipt with a tender mismatch", () => {
    expect(() =>
      buildReceiptText({
        shopName: "S",
        saleId: "1",
        createdAt: "now",
        lines: [{ name: "x", quantity: 1, lineTotal: 5000 }],
        total: 5000,
        tenders: [{ method: "cash", amount: 4000 }],
      })
    ).toThrow("receipt_tender_mismatch");
  });
});

describe("Kan R3 — local schema", () => {
  it("has version 2 tables for batches, warehouses and transfers", () => {
    const names = db.tables.map((table) => table.name);
    expect(names).toContain("batches");
    expect(names).toContain("warehouses");
    expect(names).toContain("stock_transfers");
  });
});
