import Link from "next/link";

const NAV = [
  { label: "Features", href: "/features" },
  { label: "Supported businesses", href: "/supported" },
  { label: "Pricing", href: "/pricing" },
  { label: "Devices", href: "/devices" },
  { label: "Help", href: "/help" },
];

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label="Kan home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-kan text-lg font-black text-white">
        K
      </span>
      <span className="text-xl font-extrabold tracking-tight text-ink">Kan</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="btn-quiet">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/pos" className="btn-quiet hidden sm:inline-flex">
            Open your till
          </Link>
          <Link href="/app" className="btn-primary px-4 py-2">
            Go to dashboard
          </Link>
          <details className="relative md:hidden">
            <summary className="flex h-11 w-11 list-none items-center justify-center rounded-xl border border-black/10 bg-white text-lg font-bold text-ink marker:hidden">
              <span aria-hidden="true">☰</span>
              <span className="sr-only">Open menu</span>
            </summary>
            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-black/5 bg-white p-2 shadow-xl">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block min-h-11 rounded-xl px-3 py-3 text-sm font-medium text-ink hover:bg-kan-soft"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/pos"
                className="block min-h-11 rounded-xl px-3 py-3 text-sm font-medium text-kan hover:bg-kan-soft"
              >
                Open your till
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
