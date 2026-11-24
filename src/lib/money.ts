export function ugx(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new Error("UGX amounts must be integers");
  }
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const str = abs.toString();
  const formatted = str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `UGX ${negative ? "-" : ""}${formatted}`;
}

export function parseUgx(input: string): number {
  const cleaned = input.replace(/[^0-9-]/g, "");
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) {
    throw new Error("Invalid UGX amount");
  }
  return num;
}

export function isValidUgxAmount(amount: unknown): amount is number {
  return typeof amount === "number" && Number.isInteger(amount) && amount >= 0;
}
