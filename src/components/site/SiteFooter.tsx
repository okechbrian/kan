import Link from "next/link";
import { PWATA_CONTACT } from "../../lib/platform/pricing";
import { Logo } from "./SiteHeader";

const FOOTER_LINKS = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "General terms", href: "/terms" },
  { label: "Merchant terms", href: "/merchant-terms" },
  { label: "Account deletion", href: "/account-deletion" },
  { label: "Help", href: "/help" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-navy/10 bg-navy text-softwhite">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Logo variant="primary" />
            <div className="mt-4 h-1 w-10 bg-guava" aria-hidden="true" />
            <p className="mt-3 text-sm leading-relaxed text-softwhite/80">
              Your shop, in one place. Built for Ugandan shops that cannot wait for the
              network.
            </p>
            <p className="mt-2 text-xs text-softwhite/65">
              {PWATA_CONTACT.address} · {PWATA_CONTACT.phoneDisplay} · {PWATA_CONTACT.email}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Legal and help">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="min-h-11 py-3 text-sm font-medium text-softwhite/80 hover:text-teal"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-white/10 pt-6 text-xs text-softwhite/60">
          © {new Date().getFullYear()} Kan — a product of {PWATA_CONTACT.entity}. No
          invented customer counts, testimonials or revenue figures are shown on this site.
        </p>
      </div>
    </footer>
  );
}
