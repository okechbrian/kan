"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { db, type Product } from "../../lib/db";
import { getCurrentUser } from "../../lib/session";
import { ugx } from "../../lib/money";
import { BottomNav } from "../../components/BottomNav";

const REORDER_LEVEL = 5;

export default function StockPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/pin");
        return;
      }
      setIsOwner(user.role === "owner");
      const items = await db.products
        .where("shop_id")
        .equals(user.shopId)
        .filter((p) => p.active)
        .toArray();
      setProducts(items);
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const lowStock = filtered.filter((p) => p.stock_qty <= REORDER_LEVEL);
  const normalStock = filtered.filter((p) => p.stock_qty > REORDER_LEVEL);

  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-20">
      <header className="sticky top-0 z-20 bg-kan-navy px-4 py-3 text-kan-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold">Stock</h1>
          {isOwner && (
            <div className="flex flex-wrap gap-1.5">
              <Link
                href="/stock/receive"
                className="rounded-lg bg-kan-teal px-2.5 py-1.5 text-xs font-bold text-kan-navy"
              >
                Receive
              </Link>
              <Link
                href="/stock/new"
                className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-bold text-kan-white"
              >
                + Product
              </Link>
              <Link
                href="/stock/batches"
                className="rounded-lg border border-white/25 px-2.5 py-1.5 text-xs font-semibold text-kan-white"
              >
                Batches
              </Link>
              <Link
                href="/stock/transfer"
                className="rounded-lg border border-white/25 px-2.5 py-1.5 text-xs font-semibold text-kan-white"
              >
                Move
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="p-4">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-kan-navy/50" />
          <input
            type="text"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-kan-navy/20 bg-white py-2.5 pr-4 pl-10 text-sm text-kan-navy outline-none focus:border-kan-navy"
          />
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-kan-navy/60">
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-kan-navy/10 bg-white px-4 py-12 text-center text-kan-navy/65">
            <p className="font-bold text-kan-navy">No items yet.</p>
            <p className="mt-1 text-sm">Receive goods or add a product.</p>
          </div>
        ) : (
          <>
            {lowStock.length > 0 && (
              <section className="mb-5">
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-kan-navy">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-kan-guava" />
                  Low stock ({lowStock.length})
                </h2>
                <div className="space-y-1.5">
                  {lowStock.map((p) => (
                    <Link
                      key={p.id}
                      href={`/stock/${p.id}`}
                      className="flex min-h-[54px] items-center justify-between rounded-xl border border-kan-guava/50 bg-kan-guava/15 px-3.5 py-2.5 active:bg-kan-guava/25"
                    >
                      <div>
                        <p className="text-sm font-bold text-kan-navy">
                          {p.name}
                        </p>
                        <p className="text-xs text-kan-navy/65">{p.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="ugx-amount text-sm font-bold text-kan-navy">
                          {p.stock_qty} {p.unit}
                        </p>
                        <p className="ugx-amount text-xs text-kan-navy/65">
                          {ugx(p.selling_price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {normalStock.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-kan-navy/60">
                  All items ({normalStock.length})
                </h2>
                <div className="space-y-1.5">
                  {normalStock.map((p) => (
                    <Link
                      key={p.id}
                      href={`/stock/${p.id}`}
                      className="flex min-h-[54px] items-center justify-between rounded-xl border border-kan-navy/10 bg-white px-3.5 py-2.5 active:bg-kan-teal/10"
                    >
                      <div>
                        <p className="text-sm font-semibold text-kan-navy">
                          {p.name}
                        </p>
                        <p className="text-xs text-kan-navy/55">{p.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="ugx-amount text-sm font-bold text-kan-navy">
                          {p.stock_qty} {p.unit}
                        </p>
                        <p className="ugx-amount text-xs text-kan-navy/60">
                          {ugx(p.selling_price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
