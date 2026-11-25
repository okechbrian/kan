const INIT = [0x1b, 0x40];
const CUT = [0x1d, 0x56, 0x42, 0x00];
const LINE_FEED = 0x0a;

export function receiptBytes(lines: string[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [new Uint8Array(INIT)];
  for (const line of lines) {
    chunks.push(encoder.encode(`${line}\n`));
  }
  chunks.push(new Uint8Array(CUT));
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export function printableReceipt(lines: string[]) {
  return lines.join("\n");
}

export const ESC_POS_LINE_FEED = LINE_FEED;
