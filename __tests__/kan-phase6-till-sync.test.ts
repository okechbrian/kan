import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("Phase 6 — Offline till Kan brand reskin", () => {
  const tillPages = [
    "src/app/pin/page.tsx",
    "src/app/pos/page.tsx",
    "src/app/setup/page.tsx",
    "src/app/sell/page.tsx",
    "src/app/stock/page.tsx",
    "src/app/stock/new/page.tsx",
    "src/app/stock/receive/page.tsx",
    "src/app/stock/adjust/page.tsx",
    "src/app/stock/[id]/page.tsx",
    "src/app/customers/page.tsx",
    "src/app/customers/[id]/page.tsx",
    "src/app/shift/open/page.tsx",
    "src/app/shift/close/page.tsx",
    "src/app/more/page.tsx",
    "src/app/more/sales/page.tsx",
    "src/app/more/draw/page.tsx",
  ];

  it("applies Kan brand tokens across all till pages", () => {
    for (const file of tillPages) {
      const src = read(file);
      expect(src, `${file} should use Kan brand tokens`).toMatch(
        /kan-navy|kan-white|kan-teal|kan-guava/
      );
    }
  });

  it("removes legacy Duuka branding from setup page", () => {
    const setupSrc = read("src/app/setup/page.tsx");
    expect(setupSrc).not.toContain("Duuka");
    expect(setupSrc).toContain("KanLogo");
  });

  it("renders black KanLogo on thermal receipt modal and wires it into sell & sales", () => {
    const receiptSrc = read("src/components/ReceiptModal.tsx");
    expect(receiptSrc).toContain('variant="black"');
    expect(receiptSrc).toContain("window.print()");
    expect(receiptSrc).toContain("Pwata Inc");

    expect(read("src/app/sell/page.tsx")).toContain("ReceiptModal");
    expect(read("src/app/more/sales/page.tsx")).toContain("ReceiptModal");
  });

  it("uses lucide-react icons instead of raw emojis in BottomNav", () => {
    const navSrc = read("src/components/BottomNav.tsx");
    expect(navSrc).toContain("lucide-react");
    expect(navSrc).not.toContain("🛒");
    expect(navSrc).not.toContain("📦");
    expect(navSrc).not.toContain("👥");
  });
});

// Tenant isolation is exercised with adversarial HTTP requests in audit-sync.test.ts.
