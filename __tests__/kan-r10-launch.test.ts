import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  aiStatus,
  isCrisis,
  redactSensitive,
  guardQuestion,
  guardAnswer,
  buildPrompt,
  SAFE_FALLBACK,
} from "../src/lib/ai/guard";
import { PARTNER_FEATURES, canOffer, partnerMessage } from "../src/lib/banking/partners";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Kan R10 — AI guardrails", () => {
  it("reports an honest status without a key", () => {
    expect(aiStatus(false)).toBe("not_configured");
    expect(aiStatus(true)).toBe("available");
  });

  it("catches crisis language before any model call", () => {
    expect(isCrisis("I want to kill myself")).toBe(true);
    expect(isCrisis("How do I close the till?")).toBe(false);
    expect(guardQuestion("I want to hurt myself")).toMatchObject({ allowed: false, reason: "crisis" });
  });

  it("redacts phones, emails and long numbers", () => {
    const clean = redactSensitive("Call 0775931342 or a@b.com about 123456789");
    expect(clean).not.toContain("0775931342");
    expect(clean).not.toContain("a@b.com");
    expect(clean).toContain("[phone]");
  });

  it("rejects empty, oversized and overconfident answers", () => {
    expect(guardQuestion("  ")).toMatchObject({ allowed: false, reason: "empty_question" });
    expect(guardQuestion("x".repeat(900))).toMatchObject({ allowed: false, reason: "question_too_long" });
    expect(guardAnswer("I guarantee the stock is correct")).toMatchObject({
      allowed: false,
      reason: "no_guarantees",
    });
  });

  it("builds a strict prompt without leaking raw contact details", () => {
    const prompt = buildPrompt("Call 0775931342", "Owner a@b.com");
    expect(prompt).toContain("Never invent prices");
    expect(prompt).not.toContain("0775931342");
    expect(prompt).not.toContain("a@b.com");
  });

  it("keeps a safe fallback for an unconfigured AI", () => {
    expect(SAFE_FALLBACK).toContain("cannot answer");
  });
});

describe("Kan R10 — partner-only surfaces", () => {
  it("never claims a partner feature is available", () => {
    expect(PARTNER_FEATURES).toHaveLength(4);
    for (const feature of PARTNER_FEATURES) expect(canOffer(feature.id)).toBe(false);
    expect(partnerMessage("wallet")).toContain("licensed partner");
  });
});

describe("Kan R11 — launch readiness", () => {
  it("has a launch checklist and CI", () => {
    expect(existsSync(join(root, "LAUNCH_CHECKLIST.md"))).toBe(true);
    const checklist = read("LAUNCH_CHECKLIST.md");
    expect(checklist).toContain("DATABASE_URL");
    expect(checklist).toContain("UGX integers only");
    expect(read(".github/workflows/ci.yml")).toContain("npm run test");
  });

  it("always has an honest support page", () => {
    const page = read("src/app/support/page.tsx");
    expect(page).toContain("to be confirmed");
    expect(page).toContain("Clearing browser data deletes the books");
  });
});
