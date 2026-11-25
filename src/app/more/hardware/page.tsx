import Link from "next/link";
import { StatusBadge } from "../../../components/site/StatusBadge";

export const metadata = { title: "Hardware" };

const DEVICES = [
  {
    name: "Barcode / QR scanner",
    state: "now" as const,
    detail:
      "Keyboard-wedge scanners need no driver: scan a code and it types into the search field. Scanning is optional; search and fast-mover tiles still work.",
  },
  {
    name: "Thermal receipt printer",
    state: "soon" as const,
    detail:
      "ESC/POS output is generated in a standard format. Direct printing opens when device permissions and a printer profile are available.",
  },
  {
    name: "Cash drawer",
    state: "soon" as const,
    detail:
      "A drawer can be attached to a supported printer. Until then, use the till close screen to count cash.",
  },
  {
    name: "POS touchscreen",
    state: "soon" as const,
    detail:
      "The phone till is the primary device. A Windows desktop client is planned for higher-volume shops.",
  },
];

export default function HardwarePage() {
  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-cream p-4 pb-20">
      <header className="mb-5 flex items-center gap-3">
        <Link href="/more" className="min-h-11 text-sm font-semibold text-kan">
          ← More
        </Link>
        <h1 className="text-lg font-bold">Hardware</h1>
      </header>
      <p className="mb-4 text-xs text-ink/50">
        No device is required to sell. Hardware is optional and only speeds up a busy
        counter.
      </p>
      <div className="space-y-3">
        {DEVICES.map((device) => (
          <section key={device.name} className="card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">{device.name}</h2>
              <StatusBadge state={device.state} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">{device.detail}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
