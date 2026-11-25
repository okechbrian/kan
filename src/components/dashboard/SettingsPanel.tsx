"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Settings } from "lucide-react";
import { db, type Shop } from "../../lib/db";
import { Input } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function SettingsPanel() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function load() {
      const shops = await db.shops.toArray();
      const first = shops[0] ?? null;
      setShop(first);
      if (first) {
        setName(first.name);
        setMomoNumber(first.momo_number);
      }
    }
    void load();
  }, []);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!shop) return;
    await db.shops.update(shop.id, {
      name: name.trim() || shop.name,
      momo_number: momoNumber.trim(),
      server_updated_at: new Date().toISOString(),
    });
    setFeedback("Shop settings saved on this device.");
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Shop settings</h1>
          <StatusBadge state="now" />
        </div>
        <p className="mt-1 text-sm text-navy/65">
          Configure shop name, MoMo number shown at checkout, PIN users and JSON backups.
        </p>
      </header>

      {shop ? (
        <form onSubmit={handleSave} className="card max-w-xl space-y-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-navy">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Active shop ({shop.shop_code})
          </h2>
          <Input
            label="Shop name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="MTN / Airtel MoMo number"
            value={momoNumber}
            onChange={(e) => setMomoNumber(e.target.value)}
            placeholder="0791149592"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary text-sm">
              Save settings
            </button>
            {feedback ? <p className="text-xs font-bold text-navy">{feedback}</p> : null}
          </div>
        </form>
      ) : (
        <div className="card space-y-3">
          <p className="text-sm font-semibold text-navy">
            No local till shop configured yet on this browser.
          </p>
          <Link href="/setup" className="btn-primary text-xs">
            Set up counter till
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/settings/users" className="card transition hover:border-navy/30">
          <h3 className="text-sm font-bold text-navy">Till PIN users →</h3>
          <p className="mt-1 text-xs text-navy/65">Add or disable attendant PINs.</p>
        </Link>
        <Link href="/more" className="card transition hover:border-navy/30">
          <h3 className="text-sm font-bold text-navy">JSON Backup & Export →</h3>
          <p className="mt-1 text-xs text-navy/65">Download or restore local shop books.</p>
        </Link>
        <Link href="/app/business/branch" className="card transition hover:border-navy/30">
          <h3 className="text-sm font-bold text-navy">Cloud branches →</h3>
          <p className="mt-1 text-xs text-navy/65">Manage multi-branch shop codes.</p>
        </Link>
      </div>
    </div>
  );
}
