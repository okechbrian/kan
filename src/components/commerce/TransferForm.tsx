"use client";

import { useEffect, useState } from "react";
import { db, type Product, type Shop } from "../../lib/db";
import { applyTransfer, validateTransfer, type TransferLine } from "../../lib/commerce/inventory";
import { generateId } from "../../lib/uuid";

export function TransferForm() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fromShopId, setFromShopId] = useState("");
  const [toShopId, setToShopId] = useState("");
  const [lines, setLines] = useState<TransferLine[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const [allShops, allProducts] = await Promise.all([
        db.shops.toArray(),
        db.products.toArray(),
      ]);
      setShops(allShops);
      setProducts(allProducts);
      if (allShops[0]) setFromShopId(allShops[0].id);
    }
    void load();
  }, []);

  const availableProducts = products.filter((product) => product.shop_id === fromShopId);

  function addLine() {
    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
      setMessage("Pick a product and a quantity above zero.");
      return;
    }
    if (lines.some((line) => line.productId === productId)) {
      setMessage("That product is already in the transfer.");
      return;
    }
    setLines([...lines, { productId, quantity }]);
    setProductId("");
    setQuantity(1);
    setMessage("");
  }

  async function submit() {
    const error = validateTransfer({ fromShopId, toShopId, lines });
    if (error) {
      setMessage(`Cannot transfer: ${error.replace(/_/g, " ")}`);
      return;
    }
    const from = new Map<string, number>();
    const to = new Map<string, number>();
    for (const product of products) {
      if (product.shop_id === fromShopId) from.set(product.id, product.stock_qty);
    }
    const result = applyTransfer(from, to, lines);
    const source = shops.find((shop) => shop.id === fromShopId);
    await db.stock_transfers.add({
      id: generateId(),
      business_id: source?.business_id ?? "",
      from_shop_id: fromShopId,
      to_shop_id: toShopId,
      lines: lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
      status: "pending",
      created_at: new Date().toISOString(),
      completed_at: null,
    });
    const warning = result.warnings.length
      ? ` Warning: ${result.warnings.join(", ")}.`
      : "";
    setMessage(`Transfer recorded locally.${warning} Stock updates when sync is available.`);
    setLines([]);
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-ink">
        From shop
        <select
          value={fromShopId}
          onChange={(event) => {
            setFromShopId(event.target.value);
            setLines([]);
          }}
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base"
        >
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-ink">
        To shop
        <select
          value={toShopId}
          onChange={(event) => setToShopId(event.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base"
        >
          <option value="">Choose a shop</option>
          {shops
            .filter((shop) => shop.id !== fromShopId)
            .map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
        </select>
      </label>

      <div className="rounded-xl border border-black/10 bg-white p-3">
        <p className="text-sm font-semibold">Items to move</p>
        <div className="mt-2 flex gap-2">
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="min-h-11 flex-1 rounded-lg border border-black/15 px-2 text-sm"
          >
            <option value="">Product</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(parseInt(event.target.value, 10) || 0)}
            className="min-h-11 w-16 rounded-lg border border-black/15 px-2 text-center text-sm"
          />
          <button onClick={addLine} className="btn-secondary px-3 py-2 text-sm">
            Add
          </button>
        </div>
        {lines.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm">
            {lines.map((line) => (
              <li key={line.productId} className="flex justify-between">
                <span>{products.find((p) => p.id === line.productId)?.name ?? "Product"}</span>
                <span>{line.quantity}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <button onClick={() => void submit()} className="btn-primary w-full">
        Record transfer
      </button>
      {message ? (
        <p role="status" className="rounded-xl bg-kan-soft p-3 text-sm text-kan-dark">
          {message}
        </p>
      ) : null}
    </div>
  );
}
