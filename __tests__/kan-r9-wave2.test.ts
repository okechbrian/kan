import { describe, it, expect } from "vitest";
import {
  dispenseBatches,
  productionPlan,
  validateTableOrder,
  bookingsConflict,
  slotsForDay,
  nextLaundryState,
  laundryTicketId,
  type Booking,
} from "../src/lib/verticals/wave2";

const today = new Date("2026-11-25T00:00:00Z");
const batches = [
  { id: "B1", productId: "p1", quantity: 5, expiryDate: "2026-12-01" },
  { id: "B2", productId: "p1", quantity: 3, expiryDate: "2020-01-01" },
];

const booking: Booking = {
  id: "bk1",
  service: "Haircut",
  staff: "Asha",
  start: "2026-11-25T10:00:00Z",
  durationMinutes: 60,
};

describe("Kan R9 wave 2 — workflow helpers", () => {
  it("dispenses from unexpired batches only", () => {
    const result = dispenseBatches(batches, 4, today);
    expect(result.allocations).toEqual([{ batchId: "B1", quantity: 4 }]);
    expect(result.blocked).toEqual(["B2"]);
    expect(result.shortfall).toBe(0);
    expect(dispenseBatches(batches, 8, today).shortfall).toBe(3);
  });

  it("scales a recipe with integer grams", () => {
    expect(
      productionPlan(
        [
          { name: "Flour", gramsPerUnit: 500 },
          { name: "Sugar", gramsPerUnit: 100 },
        ],
        4
      )
    ).toEqual([
      { name: "Flour", grams: 2000 },
      { name: "Sugar", grams: 400 },
    ]);
    expect(() => productionPlan([], 0)).toThrow("invalid_units");
  });

  it("validates a restaurant table order", () => {
    const order = {
      table: 3,
      covers: 2,
      lines: [{ name: "Coffee", quantity: 2, modifiers: ["no sugar"] }],
    };
    expect(validateTableOrder(order)).toBeNull();
    expect(validateTableOrder({ ...order, covers: 0 })).toBe("invalid_covers");
    expect(validateTableOrder({ ...order, lines: [] })).toBe("empty_order");
  });

  it("detects booking conflicts only for the same staff", () => {
    const overlap: Booking = {
      id: "bk2",
      service: "Shave",
      staff: "Asha",
      start: "2026-11-25T10:30:00Z",
      durationMinutes: 30,
    };
    expect(bookingsConflict([booking], overlap)).toBe(true);
    expect(bookingsConflict([booking], { ...overlap, staff: "Maria" })).toBe(false);
    expect(bookingsConflict([booking], { ...overlap, start: "2026-11-25T11:00:00Z" })).toBe(false);
  });

  it("offers free slots across a working day", () => {
    const slots = slotsForDay([booking], "2026-11-25", 30, "Asha");
    expect(slots.length).toBe(16);
    expect(slots.filter((slot) => slot.free).length).toBe(14);
  });

  it("moves laundry tickets forward and formats ids", () => {
    expect(nextLaundryState("received")).toBe("washing");
    expect(nextLaundryState("ready")).toBe("collected");
    expect(nextLaundryState("collected")).toBeNull();
    expect(laundryTicketId("nateete-shop", 7)).toBe("NATEET-0007");
  });
});
