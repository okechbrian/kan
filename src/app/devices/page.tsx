import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";
import { StatusBadge } from "../../components/site/StatusBadge";

const DEVICES = [
  {
    name: "Smart cash register",
    specs: [
      "15.6-inch HD touch screen (single or dual)",
      "Intel Core i3, Windows 11 Pro",
      "8GB RAM + 128GB SSD",
      "WiFi, Bluetooth, USB, LAN and VGA",
    ],
  },
  {
    name: "Thermal receipt printer",
    specs: ["80mm thermal roll, no ink", "200mm/s printing", "USB, LAN and Bluetooth", "Receipts, barcodes and QR codes"],
  },
  {
    name: "Barcode and QR scanner",
    specs: ["1D and 2D codes", "Reads in about 0.5s", "USB keyboard-wedge mode", "No driver needed at the till"],
  },
  {
    name: "Cash drawer",
    specs: ["4 bill slots and 5 coin compartments", "Steel construction with lock", "RJ11, RJ12 or USB", "Works with most POS systems"],
  },
];

export default function DevicesPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <p className="eyebrow">POS devices</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Hardware is optional. The till works without it.
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StatusBadge state="soon" />
          <p className="text-sm text-ink/60">
            Prices are on request until supply and support are arranged.
          </p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {DEVICES.map((device) => (
            <article key={device.name} className="card">
              <h2 className="text-xl font-bold">{device.name}</h2>
              <ul className="mt-4 space-y-2 text-sm text-ink/65">
                {device.specs.map((spec) => (
                  <li key={spec} className="flex gap-2">
                    <span className="text-kan" aria-hidden="true">
                      ✓
                    </span>
                    {spec}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm leading-relaxed text-ink/60">
          A phone is enough to sell today. Barcode scanning, printing and a cash drawer
          become useful at higher volume and are added without changing the books.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
