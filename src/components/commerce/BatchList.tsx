"use client";

import { useEffect, useState } from "react";
import { db, type Batch, type Product } from "../../lib/db";
import { expiryStatus } from "../../lib/commerce/inventory";

export function BatchList() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [allBatches, allProducts] = await Promise.all([
        db.batches.toArray(),
        db.products.toArray(),
      ]);
      setBatches(allBatches);
      setProducts(
        allProducts.reduce<Record<string, Product>>((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {})
      );
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) return <p className="py-8 text-center text-sm text-gray-500">Loading...</p>;
  if (batches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-5 text-sm text-gray-500">
        No batches yet. Receive goods with an expiry date to see them here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {batches.map((batch) => {
        const status = expiryStatus(batch.expiry_date ?? null);
        const colour =
          status === "expired"
            ? "bg-red-100 text-red-800"
            : status === "expiring"
              ? "bg-amber-100 text-amber-900"
              : "bg-kan-soft text-kan-dark";
        return (
          <div
            key={batch.id}
            className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-3"
          >
            <div>
              <p className="text-sm font-semibold">
                {products[batch.product_id]?.name ?? batch.product_id}
              </p>
              <p className="text-xs text-gray-500">
                {batch.quantity} on hand · {batch.expiry_date ?? "no expiry"}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${colour}`}>
              {status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
