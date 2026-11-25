import { describe, it, expect } from "vitest";
import {
  VERTICALS,
  verticalById,
  verticalsByWave,
  supports,
  recommendedReorderLevel,
} from "../src/lib/verticals/profiles";
import {
  validateVerticalSelection,
  shopCanUse,
  starterProducts,
  WAVE_LABELS,
} from "../src/lib/verticals/workflows";

describe("Kan R9 — vertical profiles", () => {
  it("covers all 16 businesses in three waves", () => {
    expect(VERTICALS).toHaveLength(16);
    expect(new Set(VERTICALS.map((profile) => profile.id)).size).toBe(16);
    expect(verticalsByWave(1)).toHaveLength(5);
    expect(verticalsByWave(2)).toHaveLength(5);
    expect(verticalsByWave(3)).toHaveLength(6);
    expect(VERTICALS.filter((profile) => profile.state === "available")).toHaveLength(5);
  });

  it("marks only wave 1 as available", () => {
    for (const profile of VERTICALS) {
      expect(profile.state === "available").toBe(profile.wave === 1);
    }
  });

  it("looks up profiles and capabilities", () => {
    expect(verticalById("groceries")?.name).toBe("Groceries");
    expect(supports("groceries", "credit")).toBe(true);
    expect(supports("kiosks", "credit")).toBe(false);
    expect(recommendedReorderLevel("kiosks")).toBe(3);
    expect(recommendedReorderLevel("unknown")).toBe(5);
  });
});

describe("Kan R9 — vertical workflows", () => {
  it("accepts wave 1 selections and rejects planned ones", () => {
    expect(validateVerticalSelection("groceries").ok).toBe(true);
    expect(validateVerticalSelection("pharmacy")).toMatchObject({
      ok: false,
      error: "vertical_planned",
      wave: 2,
    });
    expect(validateVerticalSelection("nope")).toMatchObject({ ok: false, error: "unknown_vertical" });
  });

  it("refuses capabilities for planned profiles", () => {
    expect(shopCanUse("groceries", "fast_movers")).toBe(true);
    expect(shopCanUse("smes", "multi_branch")).toBe(true);
    expect(shopCanUse("pharmacy", "expiry")).toBe(false);
  });

  it("gives starter products only for available profiles", () => {
    expect(starterProducts("groceries")).toContain("Sugar 1kg");
    expect(starterProducts("bars")).toContain("Beer 500ml");
    expect(starterProducts("pharmacy")).toHaveLength(0);
  });

  it("labels every wave", () => {
    for (const wave of [1, 2, 3]) expect(WAVE_LABELS[wave]).toBeTruthy();
  });
});
