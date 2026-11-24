"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { db } from "../../lib/db";
import { searchMerchants, type DirectoryMerchant } from "../../lib/channels/directory";
import { slugifyShop } from "../../lib/store/catalogue";
import { StatusBadge } from "../site/StatusBadge";

export function DirectoryView() {
  const [merchants, setMerchants] = useState<DirectoryMerchant[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      const shops = await db.shops.toArray();
      setMerchants(
        shops.map((shop) => ({
          id: shop.id,
          name: shop.name,
          slug: slugifyShop(shop.name),
          category: "groceries" as const,
          town: "",
          active: shop.active,
        }))
      );
    }
    void load();
  }, []);

  const results = useMemo(() => searchMerchants(merchants, { q: query }), [merchants, query]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge state="soon" />
        <p className="text-sm text-ink/60">
          A preview built from shops on this device. The public directory opens with cloud sync.
        </p>
      </div>
      <label className="mt-6 block text-sm font-semibold text-ink">
        Search shops
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Shop name or town"
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base"
        />
      </label>
      {results.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-ink/50">
          No shops match yet. Add a shop on the till to see it here.
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((merchant) => (
            <article key={merchant.id} className="card flex flex-col gap-2">
              <h2 className="text-lg font-bold">{merchant.name}</h2>
              <p className="text-xs text-ink/50 capitalize">{merchant.category}</p>
              <Link
                href={`/shop/${merchant.slug}`}
                className="btn-secondary mt-2 justify-center text-sm"
              >
                View storefront
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
