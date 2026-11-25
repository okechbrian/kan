import { expiryStatus, fifoAllocate, type Batch } from "../commerce/inventory";
import type { TransferLine } from "../commerce/inventory";

export type DispenseResult = {
  allocations: { batchId: string; quantity: number }[];
  shortfall: number;
  blocked: string[];
};

export function dispenseBatches(batches: Batch[], quantity: number, today = new Date()) {
  const usable = batches.filter((batch) => expiryStatus(batch.expiryDate, today) !== "expired");
  const blocked = batches
    .filter((batch) => expiryStatus(batch.expiryDate, today) === "expired")
    .map((batch) => batch.id);
  const result = fifoAllocate(usable, quantity);
  return {
    allocations: result.allocations,
    shortfall: result.shortfall,
    blocked,
  } satisfies DispenseResult;
}

export type Ingredient = { name: string; gramsPerUnit: number };

export function productionPlan(recipe: Ingredient[], units: number) {
  if (!Number.isInteger(units) || units <= 0) throw new Error("invalid_units");
  return recipe
    .map((item) => ({
      name: item.name,
      grams: item.gramsPerUnit * units,
    }))
    .filter((item) => {
      if (!Number.isSafeInteger(item.grams)) throw new Error("amount_too_large");
      return item.grams > 0;
    });
}

export type TableOrder = {
  table: number;
  covers: number;
  lines: { name: string; quantity: number; modifiers: string[] }[];
};

export function validateTableOrder(order: TableOrder) {
  if (!Number.isInteger(order.table) || order.table <= 0) return "invalid_table";
  if (!Number.isInteger(order.covers) || order.covers <= 0) return "invalid_covers";
  if (order.lines.length === 0) return "empty_order";
  for (const line of order.lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) return "invalid_quantity";
  }
  return null;
}

export type Booking = {
  id: string;
  service: string;
  staff: string;
  start: string;
  durationMinutes: number;
};

export function bookingsConflict(existing: Booking[], candidate: Booking) {
  const start = new Date(candidate.start).getTime();
  const end = start + candidate.durationMinutes * 60000;
  return existing.some((booking) => {
    if (booking.staff !== candidate.staff) return false;
    const otherStart = new Date(booking.start).getTime();
    const otherEnd = otherStart + booking.durationMinutes * 60000;
    return start < otherEnd && otherStart < end;
  });
}

export function slotsForDay(
  bookings: Booking[],
  date: string,
  slotMinutes = 30,
  staff = "any"
) {
  const day = new Date(`${date}T00:00:00Z`).getTime();
  const slots: { start: string; free: boolean }[] = [];
  for (let minute = 9 * 60; minute < 17 * 60; minute += slotMinutes) {
    const start = new Date(day + minute * 60000).toISOString();
    const probe: Booking = {
      id: "probe",
      service: "",
      staff,
      start,
      durationMinutes: slotMinutes,
    };
    slots.push({ start, free: !bookingsConflict(bookings, probe) });
  }
  return slots;
}

export const LAUNDRY_STATES = ["received", "washing", "ready", "collected"] as const;
export type LaundryState = (typeof LAUNDRY_STATES)[number];

export function nextLaundryState(current: LaundryState) {
  const index = LAUNDRY_STATES.indexOf(current);
  return index < 0 || index === LAUNDRY_STATES.length - 1 ? null : LAUNDRY_STATES[index + 1];
}

export function laundryTicketId(shopSlug: string, sequence: number) {
  return `${shopSlug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)}-${String(sequence).padStart(4, "0")}`;
}

export type TransferLineLike = TransferLine;
