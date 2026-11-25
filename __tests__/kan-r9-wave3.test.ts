import { describe, it, expect } from "vitest";
import {
  explodeBom,
  productionBatchCode,
  validateSerial,
  warrantyExpiry,
  underWarranty,
  deliveryQuote,
  nextDeliveryState,
} from "../src/lib/verticals/wave3";

describe("Kan R9 wave 3 — production and BOM", () => {
  it("explodes a bill of materials and reports shortfalls", () => {
    const result = explodeBom(
      [
        { sku: "Wood", quantityPerUnit: 2, available: 10 },
        { sku: "Screws", quantityPerUnit: 4, available: 6 },
      ],
      3
    );
    expect(result).toEqual([
      { sku: "Wood", required: 6, available: 10, shortfall: 0 },
      { sku: "Screws", required: 12, available: 6, shortfall: 6 },
    ]);
    expect(() => explodeBom([], 0)).toThrow("invalid_units");
  });

  it("makes a stable production batch code", () => {
    expect(productionBatchCode(new Date("2026-11-25T00:00:00Z"), 7)).toBe("PR-20261125-007");
  });
});

describe("Kan R9 wave 3 — serials and warranty", () => {
  it("validates and normalises serials", () => {
    expect(validateSerial(" abc-12345 ")).toBe(true);
    expect(validateSerial("abc!")).toBe(false);
  });

  it("computes warranty expiry without float money or date drift", () => {
    const expiry = warrantyExpiry("2026-11-25", 12);
    expect(expiry).toBe("2027-11-25");
    expect(underWarranty(expiry, new Date("2027-01-01"))).toBe(true);
    expect(underWarranty(expiry, new Date("2028-01-01"))).toBe(false);
    expect(() => warrantyExpiry("bad", 12)).toThrow("invalid_date");
  });
});

describe("Kan R9 wave 3 — delivery", () => {
  it("quotes known bands and a default for unknown areas", () => {
    expect(deliveryQuote("Within Kampala")).toEqual({
      band: "Within Kampala",
      fee: 5000,
      etaDays: 1,
    });
    expect(deliveryQuote("Mars").fee).toBe(15000);
  });

  it("moves deliveries forward and stops at final states", () => {
    expect(nextDeliveryState("booked")).toBe("picked_up");
    expect(nextDeliveryState("in_transit")).toBe("delivered");
    expect(nextDeliveryState("delivered")).toBeNull();
    expect(nextDeliveryState("failed")).toBeNull();
  });
});
