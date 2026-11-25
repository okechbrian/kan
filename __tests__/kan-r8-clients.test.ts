import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { retryDelay, shouldRetry, pendingItems, markSynced } from "../src/lib/sync/retry";
import { normaliseScan, isLikelyBarcode, classifyScan, findByCode } from "../src/lib/hardware/barcode";
import { receiptBytes, printableReceipt } from "../src/lib/hardware/escpos";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Kan R8 — sync retry", () => {
  it("backs off exponentially with a cap", () => {
    expect(retryDelay(0)).toBe(1000);
    expect(retryDelay(1)).toBe(2000);
    expect(retryDelay(2)).toBe(4000);
    expect(retryDelay(20)).toBe(30000);
    expect(() => retryDelay(-1)).toThrow("invalid_attempt");
  });

  it("retries transient failures only", () => {
    expect(shouldRetry(500, 0)).toBe(true);
    expect(shouldRetry(429, 0)).toBe(true);
    expect(shouldRetry(400, 0)).toBe(false);
    expect(shouldRetry(500, 5)).toBe(false);
  });

  it("flushes the oldest pending outbox items first", () => {
    const items = [
      { id: "b", created_at: "2026-11-25T10:00:00Z" },
      { id: "a", created_at: "2026-11-25T09:00:00Z", synced_at: "2026-11-25T09:01:00Z" },
      { id: "c", created_at: "2026-11-25T11:00:00Z" },
    ];
    expect(pendingItems(items).map((item) => item.id)).toEqual(["b", "c"]);
    expect(pendingItems(items, 1).map((item) => item.id)).toEqual(["b"]);
    expect(markSynced(items, "b", "now").find((item) => item.id === "b")?.synced_at).toBe("now");
  });
});

describe("Kan R8 — optional barcode", () => {
  it("recognises keyboard-wedge scans", () => {
    expect(normaliseScan(" 590-1234567890 ")).toBe("5901234567890");
    expect(isLikelyBarcode("5901234567890")).toBe(true);
    expect(isLikelyBarcode("abc123")).toBe(false);
    expect(classifyScan("5901234567890")).toBe("barcode");
    expect(classifyScan("https://example.com/qr")).toBe("qr");
    expect(classifyScan("123")).toBe("unknown");
  });

  it("finds a product by barcode or SKU", () => {
    const products = [{ sku_code: "SKU-1", barcode: "5901234567890" }];
    expect(findByCode(products, "590-1234567890")?.sku_code).toBe("SKU-1");
    expect(findByCode(products, "SKU-1")).toBeDefined();
  });
});

describe("Kan R8 — ESC/POS output", () => {
  it("wraps text in init and cut commands", () => {
    const bytes = receiptBytes(["Kan", "TOTAL UGX 5,000"]);
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x1b, 0x40]);
    expect(Array.from(bytes.slice(-4))).toEqual([0x1d, 0x56, 0x42, 0x00]);
    expect(new TextDecoder().decode(bytes)).toContain("TOTAL UGX 5,000");
    expect(printableReceipt(["a", "b"])).toBe("a\nb");
  });
});

describe("Kan R8 — installable shell", () => {
  it("has a PWA manifest and an offline fallback", () => {
    expect(existsSync(join(root, "public/manifest.webmanifest"))).toBe(true);
    const manifest = read("public/manifest.webmanifest");
    expect(manifest).toContain('"display": "standalone"');
    expect(manifest).toContain('"start_url": "/pos"');
    expect(read("public/sw.js")).toContain('caches.match("/offline")');
    expect(read("src/app/layout.tsx")).toContain("ServiceWorkerRegister");
  });
});
