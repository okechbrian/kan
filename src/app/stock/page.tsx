"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Stock</h1>
          {isOwner && (
            <div className="flex gap-2">
              <Link
                href="/stock/receive"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-white text-xs font-medium active:bg-blue-700"
              >
                Receive goods
              </Link>
              <Link
                href="/stock/new"
                className="rounded-lg bg-green-600 px-3 py-1.5 text-white text-xs font-medium active:bg-green-700"
              >
                Add product
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="p-4">
        <input
          type="text"
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 mb-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />

        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No items yet.</p>
            <p className="text-sm mt-1">
              Receive goods or add a product.
            </p>
          </div>
        ) : (
          <>
            {lowStock.length > 0 && (
              <section className="mb-4">
                <h2 className="text-xs font-semibold text-orange-600 uppercase mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
                  Low stock ({lowStock.length})
                </h2>
                <div className="space-y-1.5">
                  {lowStock.map((p) => (
                    <Link
                      key={p.id}
                      href={`/stock/${p.id}`}
                      className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 active:bg-orange-100"
                    >
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.unit}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold text-sm ${
                            p.stock_qty === 0
                              ? "text-red-600"
                              : "text-orange-600"
                          }`}
                        >
                          {p.stock_qty} {p.unit}
                        </p>
                        <p className="text-xs text-gray-500">
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
                <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  All items ({normalStock.length})
                </h2>
                <div className="space-y-1.5">
                  {normalStock.map((p) => (
                    <Link
                      key={p.id}
                      href={`/stock/${p.id}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 active:bg-gray-100"
                    >
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">
                          {p.stock_qty} {p.unit}
                        </p>
                        <p className="text-xs text-gray-500">
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
