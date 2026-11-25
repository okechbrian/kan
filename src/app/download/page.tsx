import Link from "next/link";
import { Globe, Laptop, Smartphone } from "lucide-react";
import { SharedBottomFunnel } from "../../components/site/SharedBottomFunnel";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";
import { StatusBadge } from "../../components/site/StatusBadge";

export default function DownloadPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="max-w-3xl">
            <p className="eyebrow">Download & install</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
              Run Kan in your browser today — install to your home screen in seconds.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-navy/75">
              The web till and PWA work offline right now on Android phones and laptops.
              Native Play Store, App Store and Windows installers follow in Phase 7.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="card flex flex-col justify-between border-teal/40 bg-teal-soft">
              <div>
                <div className="flex items-center justify-between">
                  <Globe className="h-6 w-6 text-navy" aria-hidden="true" />
                  <StatusBadge state="now" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-navy">
                  Web App & Installable PWA
                </h2>
                <p className="mt-2 text-sm text-navy/75">
                  Open Kan in Chrome or Safari and choose &ldquo;Add to Home Screen&rdquo; to run
                  full-screen and sell offline with zero app-store wait.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/pos" className="btn-primary text-sm">
                  Open web till
                </Link>
                <Link href="/more/install" className="btn-secondary text-sm">
                  Install instructions
                </Link>
              </div>
            </article>

            <article id="android" className="card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <Smartphone className="h-6 w-6 text-navy" aria-hidden="true" />
                  <StatusBadge state="soon" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-navy">
                  Android App (Google Play)
                </h2>
                <p className="mt-2 text-sm text-navy/70">
                  Dedicated Android wrapper with native Bluetooth thermal printing and
                  background sync. Currently use the installable PWA.
                </p>
              </div>
            </article>

            <article id="ios" className="card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <Smartphone className="h-6 w-6 text-navy" aria-hidden="true" />
                  <StatusBadge state="soon" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-navy">
                  iOS App (App Store)
                </h2>
                <p className="mt-2 text-sm text-navy/70">
                  Native iPhone & iPad client for shop owners monitoring multi-branch
                  sales and alerts remotely.
                </p>
              </div>
            </article>

            <article id="windows" className="card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <Laptop className="h-6 w-6 text-navy" aria-hidden="true" />
                  <StatusBadge state="soon" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-navy">
                  Windows Desktop (.exe)
                </h2>
                <p className="mt-2 text-sm text-navy/70">
                  Signed Windows desktop client for counter cash registers with USB
                  scanner, thermal printer and cash drawer support.
                </p>
              </div>
            </article>
          </div>
        </section>
        <SharedBottomFunnel />
      </main>
      <SiteFooter />
    </>
  );
}
