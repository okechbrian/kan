import Link from "next/link";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";

const QUESTIONS = [
  {
    q: "What is Kan?",
    a: "A platform for Ugandan shops. The offline till, stock, credit and till close are ready; storefronts, payments and analytics are being added in stages.",
  },
  {
    q: "Do I need to download Kan to use the web version?",
    a: "No. The till and dashboard run in a browser. Native apps are planned but not required.",
  },
  {
    q: "Can I sell without the internet?",
    a: "Yes. A failed fetch never blocks a sale. Records sync when the network returns.",
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
    q: "How do I cancel?",
    a: "Cancellation terms are published with billing. Your data remains exportable.",
  },
];

export default function HelpPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <p className="eyebrow">Help</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Answers before you ask.
        </h1>
        <div className="mt-8 grid gap-3">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="card">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">
                {item.q}
                <span aria-hidden="true" className="text-kan">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink/60">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-ink p-6 text-white">
          <h2 className="text-xl font-bold">Still stuck?</h2>
          <p className="mt-2 text-sm text-white/60">
            Contact: [support address to be confirmed]. For now, the till help is inside
            the app.
          </p>
          <Link href="/pos" className="btn-secondary mt-5 border-white/20 bg-transparent text-white hover:bg-white/10">
            Open the till
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
