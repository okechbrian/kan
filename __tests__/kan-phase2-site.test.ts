import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { POST as contactPost } from "../src/app/api/public/contact/route";
import { POST as newsletterPost } from "../src/app/api/public/newsletter/route";
import { POST as deletionPost } from "../src/app/api/public/account-deletion/route";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const PHASE2_PUBLIC_PAGES = [
  "src/app/page.tsx",
  "src/app/manage-sales/page.tsx",
  "src/app/manage-inventory/page.tsx",
  "src/app/payment/page.tsx",
  "src/app/onlineshop/page.tsx",
  "src/app/business-analytics/page.tsx",
  "src/app/features/page.tsx",
  "src/app/supported/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/devices/page.tsx",
  "src/app/discover/page.tsx",
  "src/app/download/page.tsx",
  "src/app/help/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/privacy-policy/page.tsx",
  "src/app/terms/page.tsx",
  "src/app/general-terms/page.tsx",
  "src/app/merchant-terms/page.tsx",
  "src/app/account-deletion/page.tsx",
];

describe("Kan Phase 2 — 14-page Konna-parity public site", () => {
  it("contains every public route", () => {
    for (const file of PHASE2_PUBLIC_PAGES) {
      expect(existsSync(join(root, file))).toBe(true);
    }
  });

  it("never copies Konna text, locations, metrics or emails", () => {
    const siteComponents = readdirSync(join(root, "src/components/site")).map(
      (f) => `src/components/site/${f}`,
    );
    const forbidden = [
      "2.42M",
      "50K businesses",
      "10K+",
      "412 products",
      "Enugu",
      "hello@konna.io",
      "Nigeria",
    ];
    for (const file of [...PHASE2_PUBLIC_PAGES, ...siteComponents]) {
      const content = read(file);
      for (const word of forbidden) {
        expect(content).not.toContain(word);
      }
    }
  });

  it("validates POST /api/public/contact", async () => {
    const bad = await contactPost(
      new Request("http://localhost/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", phone: "123", email: "bad", message: "hi" }),
      }),
    );
    expect(bad.status).toBe(400);

    const ok = await contactPost(
      new Request("http://localhost/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sarah Namukasa",
          phone: "0791149592",
          email: "sarah@example.com",
          message: "Interested in setting up Kan across two branches in Entebbe.",
        }),
      }),
    );
    expect(ok.status).toBe(200);
    const data = (await ok.json()) as { ok: boolean; referenceId: string };
    expect(data.ok).toBe(true);
    expect(data.referenceId).toMatch(/^KAN-INQ-/);
  });

  it("validates POST /api/public/newsletter", async () => {
    const bad = await newsletterPost(
      new Request("http://localhost/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    );
    expect(bad.status).toBe(400);

    const ok = await newsletterPost(
      new Request("http://localhost/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "shop@example.ug" }),
      }),
    );
    expect(ok.status).toBe(200);
    const data = (await ok.json()) as { ok: boolean; email: string };
    expect(data.ok).toBe(true);
    expect(data.email).toBe("shop@example.ug");
  });

  it("validates POST /api/public/account-deletion", async () => {
    const bad = await deletionPost(
      new Request("http://localhost/api/public/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "bad", businessName: "", phone: "1" }),
      }),
    );
    expect(bad.status).toBe(400);

    const ok = await deletionPost(
      new Request("http://localhost/api/public/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "owner@example.ug",
          businessName: "Kiwafu Traders",
          phone: "0791149592",
          reason: "Closing branch",
        }),
      }),
    );
    expect(ok.status).toBe(200);
    const data = (await ok.json()) as {
      ok: boolean;
      referenceId: string;
      retentionNote: string;
    };
    expect(data.ok).toBe(true);
    expect(data.referenceId).toMatch(/^KAN-DEL-/);
    expect(data.retentionNote).toContain("90 days");
  });
});
