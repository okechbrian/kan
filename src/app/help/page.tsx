import Link from "next/link";
import { Mail, MapPin, MessageCircle, Plus } from "lucide-react";
import { ContactForm } from "../../components/site/PublicForms";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";
import { PWATA_CONTACT } from "../../lib/platform/pricing";

const QUESTIONS = [
  {
    q: "What is Kan?",
    a: "Kan (a product of Pwata Inc) is a commerce platform for Ugandan shops. The offline till, stock, credit and till close are ready; cloud workspaces and gateways roll out in stages.",
  },
  {
    q: "Do I need to download Kan to use the web version?",
    a: "No. The till and dashboard run in a browser. You can also add Kan to your phone home screen as a PWA.",
  },
  {
    q: "Can I sell without the internet?",
    a: "Yes. A failed fetch never blocks a sale. Records save locally on your device and sync when the network returns.",
  },
  {
    q: "How are staff monitored?",
    a: "Every till user has a PIN and each sale records who made it. Owner reports show sales per user.",
  },
  {
    q: "What if I lose my browser data?",
    a: "Export a JSON backup from the till regularly. Until cloud sync is enabled, clearing browser data deletes the local books.",
  },
  {
    q: "How do I cancel or delete my account?",
    a: "You can cancel before your next cycle or submit a deletion request on the Account Deletion page.",
  },
];

export default function HelpPage() {
  const waNumber = PWATA_CONTACT.phoneIntl.replace("+", "");

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="max-w-3xl">
          <p className="eyebrow">Help & contact</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            How can we help your shop?
          </h1>
          <p className="mt-4 text-base text-navy/70">
            Reach Pwata Inc support by form, WhatsApp or email, or review common answers
            below.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <a
              href={`mailto:${PWATA_CONTACT.email}`}
              className="card flex items-start gap-4 transition hover:border-navy/30"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-navy">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-navy/60">Email us</p>
                <p className="mt-1 text-base font-bold text-navy">
                  {PWATA_CONTACT.email}
                </p>
              </div>
            </a>

            <a
              href={`https://wa.me/${waNumber}`}
              className="card flex items-start gap-4 transition hover:border-navy/30"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-navy">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-navy/60">
                  WhatsApp & Phone
                </p>
                <p className="mt-1 text-base font-bold text-navy">
                  {PWATA_CONTACT.phoneDisplay}
                </p>
              </div>
            </a>

            <div className="card flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-navy">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-navy/60">Office</p>
                <p className="mt-1 text-sm font-bold text-navy">
                  {PWATA_CONTACT.entity}
                </p>
                <p className="text-sm text-navy/70">{PWATA_CONTACT.address}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-navy p-5 text-softwhite">
              <p className="text-sm font-bold">Need the offline counter till?</p>
              <p className="mt-1 text-xs text-softwhite/75">
                Open the till directly or export a JSON backup from More → Backup.
              </p>
              <Link href="/pos" className="btn-primary-dark mt-4 text-xs">
                Open the till
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>

        <section className="mt-14 border-t border-navy/10 pt-10">
          <h2 className="text-2xl font-bold text-navy">Frequently asked questions</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {QUESTIONS.map((item) => (
              <details key={item.q} className="card">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold text-navy marker:hidden">
                  {item.q}
                  <Plus className="h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-navy/70">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
