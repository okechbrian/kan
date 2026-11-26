"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ownerContext } from "../../lib/dashboard/access";

const ACCOUNT_ROUTES = new Set(["/app/sign-in", "/app/signup", "/app/forgot-password", "/app/reset-password", "/app/business/create", "/app/business/branch", "/app/billing"]);

export function OwnerBoundary({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [access, setAccess] = useState<{ path: string; key: string } | null>(null);
  const [checked, setChecked] = useState("");
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const actor = await ownerContext();
        if (active) setAccess({ path, key: `${actor.userId}:${actor.shopId}` });
      } catch { if (active) setAccess(null); }
      if (active) setChecked(path);
    }
    void check();
    window.addEventListener("storage", check);
    window.addEventListener("kan-session", check);
    window.addEventListener("focus", check);
    return () => { active = false; window.removeEventListener("storage", check); window.removeEventListener("kan-session", check); window.removeEventListener("focus", check); };
  }, [path]);
  if (ACCOUNT_ROUTES.has(path)) return <>{children}</>;
  if (checked !== path) return <p>Checking owner access…</p>;
  if (!access || access.path !== path) return <div className="card space-y-3"><h1 className="text-xl font-bold">Owner access required</h1><p>Unlock this shop’s till with your owner PIN to view or change its books. Attendants can keep selling from the till.</p><Link href="/pin" className="btn-primary">Unlock till</Link><Link href="/setup" className="btn-secondary">Set up this device</Link></div>;
  return <div key={access.key}>{children}</div>;
}
