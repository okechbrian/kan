import { Check, HardDrive, MessageCircle } from "lucide-react";
import { SharedBottomFunnel } from "../../components/site/SharedBottomFunnel";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";
import { StatusBadge } from "../../components/site/StatusBadge";
import { ugx } from "../../lib/money";
import { KAN_HARDWARE_DEVICES, PWATA_CONTACT } from "../../lib/platform/pricing";

export default function DevicesPage() {
  const waNumber = PWATA_CONTACT.phoneIntl.replace("+", "");

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="max-w-3xl">
            <p className="eyebrow">POS devices</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
              Sell faster with dedicated counter hardware.
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusBadge state="soon" />
              <p className="text-sm text-navy/70">
                Hardware is optional — any Android phone runs the Kan till today.
                Indicative Uganda prices in integer UGX below.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {KAN_HARDWARE_DEVICES.map((device) => (
              <article key={device.id} className="card flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-soft text-navy">
                      <HardDrive className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="ugx-amount text-xl font-bold text-navy">
                      {ugx(device.priceUgx)}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-navy">{device.name}</h2>
                  <p className="mt-1 text-sm text-navy/70">{device.summary}</p>
                  <ul className="mt-4 space-y-2 text-sm text-navy/75">
                    {device.specs.map((spec) => (
                      <li key={spec} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-t border-navy/10 pt-4">
                  <a
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                      `Hello Pwata Inc, I would like to enquire about ordering ${device.name} (${ugx(device.priceUgx)}).`,
                    )}`}
                    className="btn-primary w-full gap-2 text-sm"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Enquire on WhatsApp
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
        <SharedBottomFunnel />
      </main>
      <SiteFooter />
    </>
  );
}
