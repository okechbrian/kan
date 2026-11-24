import Link from "next/link";
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
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              Your shop, in one place. Built for Ugandan shops that cannot wait for the
              network.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Legal and help">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="min-h-11 py-3 text-sm font-medium text-ink/60 hover:text-kan"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-black/5 pt-6 text-xs text-ink/40">
          © {new Date().getFullYear()} Kan. [Legal entity to be confirmed]. No customer
          counts, testimonials or revenue figures are shown on this site.
        </p>
      </div>
    </footer>
  );
}
