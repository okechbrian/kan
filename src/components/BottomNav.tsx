"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Package,
  Users,
  MoreHorizontal,
} from "lucide-react";

const tabs = [
  { label: "Sell", href: "/sell", Icon: ShoppingCart },
  { label: "Stock", href: "/stock", Icon: Package },
  { label: "Deni", href: "/customers", Icon: Users },
  { label: "More", href: "/more", Icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Till navigation"
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-kan-navy/10 bg-white/95 backdrop-blur print:hidden"
    >
      <div className="mx-auto flex max-w-[420px] justify-around">
        {tabs.map(({ label, href, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs transition-colors ${
                active
                  ? "font-bold text-kan-navy"
                  : "font-medium text-kan-navy/55 hover:text-kan-navy"
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-3 right-3 h-[3px] rounded-b-full bg-kan-teal"
                />
              )}
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.9} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
