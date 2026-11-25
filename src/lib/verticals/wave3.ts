export type BomComponent = {
  sku: string;
  quantityPerUnit: number;
  available: number;
};

export type BomRequirement = {
  sku: string;
  required: number;
  available: number;
  shortfall: number;
};

export function explodeBom(components: BomComponent[], units: number): BomRequirement[] {
  if (!Number.isInteger(units) || units <= 0) throw new Error("invalid_units");
  return components.map((component) => {
    if (!Number.isInteger(component.quantityPerUnit) || component.quantityPerUnit < 0) {
      throw new Error("invalid_component");
    }
    const required = component.quantityPerUnit * units;
    if (!Number.isSafeInteger(required)) throw new Error("amount_too_large");
    return {
      sku: component.sku,
      required,
      available: component.available,
      shortfall: Math.max(0, required - component.available),
    };
  });
}

export function productionBatchCode(date: Date, sequence: number) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `PR-${stamp}-${String(sequence).padStart(3, "0")}`;
}

export function normaliseSerial(raw: string) {
  return raw.replace(/[\s-]/g, "").toUpperCase().trim();
}

export function validateSerial(raw: string) {
  const serial = normaliseSerial(raw);
  return serial.length >= 6 && serial.length <= 40 && /^[A-Z0-9]+$/.test(serial);
}

export function warrantyExpiry(soldAt: string, months: number) {
  if (!Number.isInteger(months) || months <= 0) throw new Error("invalid_months");
  const sold = new Date(soldAt);
  if (Number.isNaN(sold.getTime())) throw new Error("invalid_date");
  const expiry = new Date(sold);
  expiry.setUTCMonth(expiry.getUTCMonth() + months);
  return expiry.toISOString().slice(0, 10);
}

export function underWarranty(expiryDate: string, today = new Date()) {
  return new Date(`${expiryDate}T23:59:59Z`) >= today;
}

export type DeliveryQuote = { band: string; fee: number; etaDays: number };

const QUOTES: Record<string, DeliveryQuote> = {
  "Within the trading centre": { band: "Within the trading centre", fee: 0, etaDays: 0 },
  "Within Kampala": { band: "Within Kampala", fee: 5000, etaDays: 1 },
  "Outside Kampala": { band: "Outside Kampala", fee: 15000, etaDays: 3 },
};

export function deliveryQuote(band: string): DeliveryQuote {
  return QUOTES[band] ?? { band, fee: 15000, etaDays: 5 };
}

export const DELIVERY_STATES = ["booked", "picked_up", "in_transit", "delivered", "failed"] as const;
export type DeliveryState = (typeof DELIVERY_STATES)[number];

export function nextDeliveryState(current: DeliveryState) {
  const index = DELIVERY_STATES.indexOf(current);
  if (index < 0 || current === "delivered" || current === "failed") return null;
  return DELIVERY_STATES[index + 1];
}
