import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { PWATA_CONTACT } from "../../lib/platform/pricing";
import { Logo } from "./SiteHeader";

const FOOTER_FEATURES = [
  { label: "Online Shop", href: "/onlineshop" },
  { label: "Payments", href: "/payment" },
  { label: "Sales Management", href: "/manage-sales" },
  { label: "Inventory Management", href: "/manage-inventory" },
  { label: "Business Analytics", href: "/business-analytics" },
  { label: "Pricing", href: "/pricing" },
];

const FOOTER_BUSINESSES = [
  { label: "Pharmaceutical shops", href: "/supported#pharmacy" },
  { label: "Restaurants", href: "/supported#restaurants" },
  { label: "Superstores", href: "/supported#superstores" },
  { label: "Agro-based products", href: "/supported#agro" },
  { label: "Groceries", href: "/supported#groceries" },
  { label: "See all 16", href: "/supported" },
];

const FOOTER_DOWNLOAD = [
  { label: "Open web till", href: "/pos" },
  { label: "Install PWA", href: "/download" },
  { label: "Android app", href: "/download#android" },
  { label: "iOS app", href: "/download#ios" },
  { label: "Windows desktop", href: "/download#windows" },
  { label: "Discover merchants", href: "/discover" },
];

const FOOTER_COMPANY = [
  { label: "Contact Us", href: "/help" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Merchant Terms", href: "/merchant-terms" },
  { label: "General Terms", href: "/general-terms" },
  { label: "Account Deletion", href: "/account-deletion" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy text-softwhite">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <Logo variant="primary" />
            <div className="h-1 w-10 bg-guava" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-softwhite/80">
              Your shop, in one place. Built for Ugandan merchants selling at the counter
              and online, even when the network drops.
            </p>
            <div className="space-y-2 text-xs text-softwhite/75">
              <p className="font-bold text-softwhite">
                Uganda · {PWATA_CONTACT.entity}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" aria-hidden="true" />
                <span>{PWATA_CONTACT.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden="true" />
                <a
                  href={`https://wa.me/${PWATA_CONTACT.phoneIntl.replace("+", "")}`}
                  className="hover:text-teal"
                >
                  WhatsApp & Phone: {PWATA_CONTACT.phoneDisplay}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden="true" />
                <a href={`mailto:${PWATA_CONTACT.email}`} className="hover:text-teal">
                  {PWATA_CONTACT.email}
                </a>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            <nav aria-label="Features">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal">
                Features
              </h3>
              <ul className="mt-3 space-y-2">
                {FOOTER_FEATURES.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1 text-sm text-softwhite/75 hover:text-teal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Supported businesses">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal">
                Businesses
              </h3>
              <ul className="mt-3 space-y-2">
                {FOOTER_BUSINESSES.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1 text-sm text-softwhite/75 hover:text-teal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Download and web">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal">
                Apps & Web
              </h3>
              <ul className="mt-3 space-y-2">
                {FOOTER_DOWNLOAD.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1 text-sm text-softwhite/75 hover:text-teal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Company and legal">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal">
                Company
              </h3>
              <ul className="mt-3 space-y-2">
                {FOOTER_COMPANY.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1 text-sm text-softwhite/75 hover:text-teal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-softwhite/60">
          <p>
            © {new Date().getFullYear()} Kan — a product of {PWATA_CONTACT.entity}. No
            invented customer counts or testimonials are shown on this site.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/general-terms" className="hover:text-teal">
              Terms of Use
            </Link>
            <Link href="/privacy-policy" className="hover:text-teal">
              Privacy Policy
            </Link>
            <a href={`mailto:${PWATA_CONTACT.email}`} className="hover:text-teal">
              {PWATA_CONTACT.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
