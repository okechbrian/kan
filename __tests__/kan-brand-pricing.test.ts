import { describe, expect, it } from "vitest";
import {
  KAN_HARDWARE_DEVICES,
  KAN_SUBSCRIPTION_PLANS,
  PWATA_CONTACT,
} from "../src/lib/platform/pricing";

describe("Kan brand & UGX pricing", () => {
  it("keeps Pwata Inc legal and contact metadata complete", () => {
    expect(PWATA_CONTACT.entity).toBe("Pwata Inc");
    expect(PWATA_CONTACT.address).toContain("Entebbe Kiwafu");
    expect(PWATA_CONTACT.phoneLocal).toBe("0791149592");
    expect(PWATA_CONTACT.email).toBe("ubombo256@gmail.com");
  });

  it("stores all subscription plan prices as positive safe UGX integers", () => {
    expect(KAN_SUBSCRIPTION_PLANS).toHaveLength(5);
    for (const plan of KAN_SUBSCRIPTION_PLANS) {
      const { monthly, quarterly, biannual, yearly } = plan.pricingUgx;
      for (const amount of [monthly, quarterly, biannual, yearly]) {
        expect(Number.isSafeInteger(amount)).toBe(true);
        expect(amount).toBeGreaterThan(0);
      }
      expect(quarterly).toBe(monthly * 3);
      expect(yearly).toBe(monthly * 10);
      expect(biannual).toBeLessThan(monthly * 6);
    }
  });

  it("stores all hardware prices as positive safe UGX integers", () => {
    expect(KAN_HARDWARE_DEVICES).toHaveLength(5);
    for (const device of KAN_HARDWARE_DEVICES) {
      expect(Number.isSafeInteger(device.priceUgx)).toBe(true);
      expect(device.priceUgx).toBeGreaterThan(0);
    }
  });
});
