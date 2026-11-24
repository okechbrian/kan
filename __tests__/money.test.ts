import { describe, it, expect } from "vitest";
import { ugx, parseUgx, isValidUgxAmount } from "../src/lib/money";

describe("UGX money helpers", () => {
  describe("ugx()", () => {
    it("formats zero", () => {
      expect(ugx(0)).toBe("UGX 0");
    });

    it("formats small amounts", () => {
      expect(ugx(1500)).toBe("UGX 1,500");
    });

    it("formats large amounts", () => {
      expect(ugx(50000)).toBe("UGX 50,000");
    });

    it("formats negative amounts", () => {
      expect(ugx(-5000)).toBe("UGX -5,000");
    });

    it("throws on non-integer", () => {
      expect(() => ugx(1500.5)).toThrow("UGX amounts must be integers");
    });
  });

  describe("parseUgx()", () => {
    it("parses formatted string", () => {
      expect(parseUgx("UGX 50,000")).toBe(50000);
    });

    it("parses plain number string", () => {
      expect(parseUgx("50000")).toBe(50000);
    });

    it("parses negative", () => {
      expect(parseUgx("UGX -5,000")).toBe(-5000);
    });

    it("throws on invalid", () => {
      expect(() => parseUgx("abc")).toThrow("Invalid UGX amount");
    });
  });

  describe("isValidUgxAmount()", () => {
    it("accepts positive integers", () => {
      expect(isValidUgxAmount(50000)).toBe(true);
    });

    it("accepts zero", () => {
      expect(isValidUgxAmount(0)).toBe(true);
    });

    it("rejects negative", () => {
      expect(isValidUgxAmount(-1000)).toBe(false);
    });

    it("rejects floats", () => {
      expect(isValidUgxAmount(1500.5)).toBe(false);
    });

    it("rejects non-numbers", () => {
      expect(isValidUgxAmount("50000")).toBe(false);
      expect(isValidUgxAmount(null)).toBe(false);
      expect(isValidUgxAmount(undefined)).toBe(false);
    });
  });
});
