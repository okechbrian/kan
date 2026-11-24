import { ugx } from "../money";

export type ReceiptLine = {
  name: string;
  quantity: number;
  lineTotal: number;
};

export type ReceiptTender = {
  method: string;
  amount: number;
};

export type ReceiptInput = {
  shopName: string;
  saleId: string;
  createdAt: string;
  lines: ReceiptLine[];
  total: number;
  tenders: ReceiptTender[];
  note?: string;
};

export function buildReceiptText(input: ReceiptInput): string {
  if (input.lines.reduce((sum, line) => sum + line.lineTotal, 0) !== input.total) {
    throw new Error("receipt_total_mismatch");
  }
  if (input.tenders.reduce((sum, tender) => sum + tender.amount, 0) !== input.total) {
    throw new Error("receipt_tender_mismatch");
  }
  const rows = [
    input.shopName,
    `Sale ${input.saleId}`,
    input.createdAt,
    "-".repeat(28),
    ...input.lines.map(
      (line) => `${line.name} x${line.quantity}  ${ugx(line.lineTotal)}`
    ),
    "-".repeat(28),
    `TOTAL ${ugx(input.total)}`,
    ...input.tenders.map((tender) => `${tender.method}: ${ugx(tender.amount)}`),
  ];
  if (input.note) rows.push(input.note);
  return rows.join("\n");
}

export function receiptTotals(lines: ReceiptLine[], tenders: ReceiptTender[]) {
  return {
    lines: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    tenders: tenders.reduce((sum, tender) => sum + tender.amount, 0),
  };
}
