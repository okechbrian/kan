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
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 text-sm leading-relaxed text-ink/60">{intro}</p>
        <p className="mt-4 rounded-xl border border-sun/30 bg-sun/10 p-4 text-xs font-medium text-ink/60">
          [Legal entity to be confirmed] — this placeholder is deliberate. Final legal
          copy must be reviewed before public launch.
        </p>
        <div className="mt-9 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold">{section.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
