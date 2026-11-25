import Link from "next/link";
import { StatusBadge } from "../../../components/site/StatusBadge";

export const metadata = { title: "Install Kan" };

export default function InstallPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-cream p-4 pb-20">
      <header className="mb-5 flex items-center gap-3">
        <Link href="/more" className="min-h-11 text-sm font-semibold text-kan">
          ← More
        </Link>
        <h1 className="text-lg font-bold">Install Kan</h1>
      </header>
      <div className="space-y-4">
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Web app (PWA)</h2>
            <StatusBadge state="now" />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">
            Open this site in your phone browser, use the browser menu, then choose
            &ldquo;Add to Home screen&rdquo;. The till opens like an app and works offline
            after the first visit.
          </p>
          <Link href="/pos" className="btn-secondary mt-4 text-sm">
            Open the till
          </Link>
        </section>
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Android and iOS apps</h2>
            <StatusBadge state="soon" />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">
            Native apps need store accounts and signing. Until then, the PWA gives you
            the same offline till without an installation file.
          </p>
        </section>
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Windows desktop</h2>
            <StatusBadge state="soon" />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">
            A signed installer is planned. The browser version works on Windows today.
          </p>
        </section>
        <section className="card">
          <h2 className="text-base font-bold">Offline safety</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">
            Clearing browser data deletes the shop books on that device until backup or
            sync exists. Export a JSON backup regularly from the till.
          </p>
          <Link href="/offline" className="btn-secondary mt-4 text-sm">
            See the offline page
          </Link>
        </section>
      </div>
    </main>
  );
}
