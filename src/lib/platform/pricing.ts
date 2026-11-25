export const PWATA_CONTACT = {
  entity: "Pwata Inc",
  productNote: "Kan is a product of Pwata Inc",
  address: "Block 5D, Entebbe Kiwafu, Uganda",
  phoneLocal: "0791149592",
  phoneIntl: "+256791149592",
  phoneDisplay: "+256 791 149 592",
  email: "ubombo256@gmail.com",
} as const;

export type BillingCycle = "monthly" | "quarterly" | "biannual" | "yearly";

export interface KanSubscriptionPlan {
  id: "basic" | "growth" | "scale-up" | "premium" | "enterprise";
  name: string;
  popular?: boolean;
  pricingUgx: Record<BillingCycle, number>;
  staffLimit: number | null;
  branchLimit: number | null;
  businessLimit: number | null;
  skuLimit: number | null;
  bulkUpload: boolean;
  aiInsight: boolean;
  onlineStore: string;
}

/**
 * Konna subscription tiers converted to integer UGX (1 USD ≈ 4,240 UGX, rounded to nearest UGX 1,000).
 * Quarterly = 3x monthly; 6-month = 5% off; Yearly = 10x monthly (2 months free).
 */
export const KAN_SUBSCRIPTION_PLANS: readonly KanSubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    pricingUgx: {
      monthly: 17_000,
      quarterly: 51_000,
      biannual: 97_000,
      yearly: 170_000,
    },
    staffLimit: 2,
    branchLimit: 1,
    businessLimit: 1,
    skuLimit: 500,
    bulkUpload: false,
    aiInsight: false,
    onlineStore: "Basic online store",
  },
  {
    id: "growth",
    name: "Growth",
    pricingUgx: {
      monthly: 30_000,
      quarterly: 90_000,
      biannual: 171_000,
      yearly: 300_000,
    },
    staffLimit: 3,
    branchLimit: 2,
    businessLimit: 1,
    skuLimit: 1_000,
    bulkUpload: false,
    aiInsight: false,
    onlineStore: "Customisable online store",
  },
  {
    id: "scale-up",
    name: "Scale-Up",
    popular: true,
    pricingUgx: {
      monthly: 38_000,
      quarterly: 114_000,
      biannual: 217_000,
      yearly: 380_000,
    },
    staffLimit: 5,
    branchLimit: 5,
    businessLimit: 1,
    skuLimit: 2_000,
    bulkUpload: true,
    aiInsight: false,
    onlineStore: "Customisable store, bulk CSV & branch import",
  },
  {
    id: "premium",
    name: "Premium",
    pricingUgx: {
      monthly: 64_000,
      quarterly: 192_000,
      biannual: 365_000,
      yearly: 640_000,
    },
    staffLimit: 20,
    branchLimit: 8,
    businessLimit: 3,
    skuLimit: 6_000,
    bulkUpload: true,
    aiInsight: false,
    onlineStore: "Full e-commerce & multi-branch control",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    pricingUgx: {
      monthly: 148_000,
      quarterly: 444_000,
      biannual: 844_000,
      yearly: 1_480_000,
    },
    staffLimit: null,
    branchLimit: null,
    businessLimit: null,
    skuLimit: null,
    bulkUpload: true,
    aiInsight: true,
    onlineStore: "Custom e-commerce & Smart AI Assistant",
  },
] as const;

export interface KanHardwareDevice {
  id: string;
  name: string;
  priceUgx: number;
  summary: string;
  specs: readonly string[];
}

/**
 * Konna POS hardware devices converted to integer UGX (1 NGN ≈ 3.05 UGX, rounded to nearest UGX 1,000).
 */
export const KAN_HARDWARE_DEVICES: readonly KanHardwareDevice[] = [
  {
    id: "cash-register-single",
    name: "Smart Cash Register (Single Screen)",
    priceUgx: 1_177_000,
    summary: "Touch counter terminal built for retail and hospitality.",
    specs: [
      "15.6-inch HD touch display",
      "Intel Core i3 · Windows 11 Pro",
      "8GB RAM · 128GB SSD",
      "WiFi, Bluetooth, LAN, 6× USB ports",
    ],
  },
  {
    id: "cash-register-dual",
    name: "Smart Cash Register (Dual Screen)",
    priceUgx: 1_342_000,
    summary: "Customer-facing secondary display for faster checkout trust.",
    specs: [
      "Dual touch display (15.6\" + 11.6\" / 15.6\")",
      "Intel Core i3 · Windows 11 Pro",
      "8GB RAM · 128GB SSD",
      "WiFi, Bluetooth, LAN, 6× USB ports",
    ],
  },
  {
    id: "thermal-printer",
    name: "80mm Thermal Receipt Printer",
    priceUgx: 198_000,
    summary: "Ink-free 80mm thermal receipts, barcodes and QR codes.",
    specs: [
      "200mm/s direct line thermal print",
      "203 DPI · 1.5M+ auto-cutter life",
      "USB + LAN + Bluetooth",
      "Works with Android, iOS, Windows, Linux & Mac",
    ],
  },
  {
    id: "barcode-scanner",
    name: "Barcode & QR Code Scanner",
    priceUgx: 101_000,
    summary: "Fast 0.5s 1D/2D scanning via USB HID keyboard-wedge.",
    specs: [
      "Reads 1D barcodes & 2D QR codes in 0.5s",
      "640 × 480 optical sensor",
      "USB HID plug-and-play",
      "1.5m drop durability",
    ],
  },
  {
    id: "cash-drawer",
    name: "POS Cash Drawer",
    priceUgx: 159_000,
    summary: "Steel till drawer with lock and RJ11/USB trigger.",
    specs: [
      "4 note slots + 5 coin compartments",
      "Durable steel housing (332 × 365mm)",
      "3-position security key lock",
      "RJ11 / RJ12 / USB connectivity",
    ],
  },
] as const;
