import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (relative: string) =>
  readFileSync(join(root, relative), "utf8");

const PUBLIC_ROUTES = [
  "page",
  "features/page",
  "supported/page",
  "pricing/page",
  "devices/page",
  "help/page",
  "privacy/page",
  "terms/page",
  "merchant-terms/page",
  "account-deletion/page",
  "support/page",
  "pos/page",
];

const DASHBOARD_ROUTES = [
  "dashboard",
  "products",
  "orders",
  "customers",
  "reports",
  "shops",
  "staff",
  "billing",
  "settings",
  "store",
  "channels",
  "alerts",
  "verticals",
  "ai",
  "banking",
];

describe("Kan R1 — scope and honest shell", () => {
  it("keeps the full scope file authoritative", () => {
    const scope = read("KAN_SCOPE.md");
    expect(scope).toContain("Kan — Full Scope");
    expect(scope).toContain("R1");
    expect(scope).toContain("partner-or-defer");
    expect(scope).toContain("UGX");
    expect(scope).toContain("WS-13");
  });

  it("locks the pivot decisions", () => {
    const decisions = read("DECISIONS.md");
    for (const id of ["D40", "D41", "D42", "D43", "D44", "D45", "D46", "D47"]) {
      expect(decisions).toContain(id);
    }
  });

  it("has every public route", () => {
    for (const route of PUBLIC_ROUTES) {
      const path = `src/app/${route}.tsx`;
      expect(existsSync(join(root, path))).toBe(true);
    }
  });

  it("has every dashboard route with an honest empty state", () => {
    for (const route of DASHBOARD_ROUTES) {
      const path = `src/app/app/${route}/page.tsx`;
      expect(existsSync(join(root, path))).toBe(true);
      const source = read(path);
      expect(
        ["SimplePage", "EmptyPanel", "ReportsPanel", "AlertsPanel", "ChannelsPanel", "VerticalsPanel", "AiPanel", "BankingPanel"].some(
          (component) => source.includes(component)
        )
      ).toBe(true);
    }
  });

  it("does not invent proof anywhere in the new UI", () => {
    const files = [
      ...PUBLIC_ROUTES.map((route) => `src/app/${route}.tsx`),
      ...DASHBOARD_ROUTES.map((route) => `src/app/app/${route}/page.tsx`),
      "src/components/site/HeroPreview.tsx",
      "src/components/site/SiteFooter.tsx",
    ];
    const forbidden = ["2.42M", "50K businesses", "10K+", "412 products"];
    for (const file of files) {
      const source = read(file);
      for (const phrase of forbidden) {
        expect(source).not.toContain(phrase);
      }
    }
  });

  it("makes the till entry /pos and keeps the till routes", () => {
    const pos = read("src/app/pos/page.tsx");
    expect(pos).toContain('router.replace("/pin")');
    expect(pos).toContain('router.replace("/sell")');
    for (const route of ["pin", "sell", "stock", "customers", "more"]) {
      expect(existsSync(join(root, `src/app/${route}/page.tsx`))).toBe(true);
    }
  });

  it("labels unbuilt features", () => {
    const badge = read("src/components/site/StatusBadge.tsx");
    expect(badge).toContain('now: "Available now"');
    expect(badge).toContain('soon: "Coming soon"');
    expect(badge).toContain('partner: "With partner"');
  });
});
