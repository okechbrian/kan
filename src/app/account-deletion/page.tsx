import Link from "next/link";
import { AccountDeletionForm } from "../../components/site/PublicForms";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";
import { PWATA_CONTACT } from "../../lib/platform/pricing";

export default function AccountDeletionPage() {
  return (
    <>
      <SiteHeader />
      <main className="section max-w-4xl">
        <p className="eyebrow">Account & data deletion · {PWATA_CONTACT.entity}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
          Request account deletion
        </h1>
        <p className="mt-4 text-base text-navy/70">
          Submit a request below and {PWATA_CONTACT.entity} will verify the account owner
          and follow up by email or WhatsApp.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <AccountDeletionForm />
          </div>

          <aside className="space-y-4 lg:col-span-5">
            <div className="card">
              <h2 className="text-base font-bold text-navy">Data retention</h2>
              <ul className="mt-3 space-y-2 text-sm text-navy/75">
                <li>• Active workspace data is deleted within 90 days after closure.</li>
                <li>
                  • Transaction records required under Ugandan commercial or tax law may
                  be retained for up to 7 years.
                </li>
                <li>
                  • Local device till books stay in your browser until you export a JSON
                  backup and clear site storage.
                </li>
              </ul>
            </div>
            <div className="card">
              <h2 className="text-base font-bold text-navy">Need billing help instead?</h2>
              <p className="mt-2 text-sm text-navy/70">
                Contact {PWATA_CONTACT.email} or call/WhatsApp{" "}
                {PWATA_CONTACT.phoneDisplay}.
              </p>
              <Link href="/privacy-policy" className="mt-3 inline-block text-xs font-bold text-navy underline">
                Read full privacy policy
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
