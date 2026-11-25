import { PWATA_CONTACT } from "../../lib/platform/pricing";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <>
      <SiteHeader />
      <main className="section max-w-3xl">
        <p className="eyebrow">Legal · {PWATA_CONTACT.entity}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-navy/70">{intro}</p>
        <p className="mt-4 rounded-xl border border-navy/10 bg-teal-soft p-4 text-xs font-semibold text-navy">
          {PWATA_CONTACT.productNote} · {PWATA_CONTACT.address} ·{" "}
          {PWATA_CONTACT.email} · {PWATA_CONTACT.phoneDisplay}
        </p>
        <div className="mt-9 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-navy">{section.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy/75">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
