"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Truck } from "lucide-react";
import { db, type PurchaseRecord, type SupplierRecord } from "../../lib/db";
import { ugx } from "../../lib/money";
import { validatePurchaseInput } from "../../lib/dashboard/tools";
import { generateId } from "../../lib/uuid";
import { DataTable, Input, StatCard } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function PurchasesPanel() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [shopId, setShopId] = useState("default-shop");
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [paid, setPaid] = useState("0");
  const [feedback, setFeedback] = useState("");

  async function load() {
    const [shops, pRows, sRows] = await Promise.all([
      db.shops.toArray(),
      db.purchases.toArray(),
      db.suppliers.toArray(),
    ]);
    setShopId(shops[0]?.id ?? "default-shop");
    setPurchases(pRows.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    setSuppliers(sRows);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleRecord(event: FormEvent) {
    event.preventDefault();
    setFeedback("");
    const qtyVal = Number(qty);
    const costVal = Number(unitCost);
    const paidVal = Number(paid || "0");
    const check = validatePurchaseInput({
      supplierName,
      items: [{ name: itemName, qty: qtyVal, unit_cost: costVal }],
      paid: paidVal,
    });
    if (!check.ok) {
      setFeedback(check.error);
      return;
    }

    const now = new Date().toISOString();
    let supplier = suppliers.find(
      (s) => s.name.toLowerCase() === supplierName.trim().toLowerCase(),
    );
    const owed = check.total - paidVal;
    if (!supplier) {
      supplier = {
        id: generateId(),
        shop_id: shopId,
        name: supplierName.trim(),
        phone: supplierPhone.trim(),
        email: "",
        balance: owed,
        created_at: now,
      };
      await db.suppliers.add(supplier);
    } else if (owed !== 0) {
      await db.suppliers.update(supplier.id, { balance: supplier.balance + owed });
    }

    await db.purchases.add({
      id: generateId(),
      shop_id: shopId,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      items: [
        {
          name: itemName.trim(),
          qty: qtyVal,
          unit_cost: costVal,
          line_total: check.total,
        },
      ],
      total: check.total,
      paid: paidVal,
      status: "received",
      note: "",
      created_at: now,
    });

    setSupplierName("");
    setSupplierPhone("");
    setItemName("");
    setQty("1");
    setUnitCost("");
    setPaid("0");
    setFeedback("Purchase recorded and supplier balance updated.");
    await load();
  }

  const totalPayables = suppliers.reduce((sum, s) => sum + Math.max(0, s.balance), 0);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            Purchases & suppliers
          </h1>
          <StatusBadge state="now" />
        </div>
        <p className="mt-1 text-sm text-navy/65">
          Record supplier orders, inbound stock costs and supplier payables in integer UGX.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Purchase orders" value={String(purchases.length)} />
        <StatCard
          label="Supplier payables"
          value={ugx(totalPayables)}
          deltaTone={totalPayables > 0 ? "guava" : "teal"}
        />
      </div>

      <form onSubmit={handleRecord} className="card space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy">
          <Truck className="h-4 w-4" aria-hidden="true" />
          Record supplier purchase
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Supplier name"
            required
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="e.g. Kisenyi Wholesale"
          />
          <Input
            label="Supplier phone (optional)"
            value={supplierPhone}
            onChange={(e) => setSupplierPhone(e.target.value)}
            placeholder="0791149592"
          />
          <Input
            label="Item purchased"
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Sugar 50kg bag"
          />
          <Input
            label="Quantity"
            type="number"
            min={1}
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <Input
            label="Unit cost (UGX)"
            type="number"
            min={0}
            required
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            placeholder="185000"
          />
          <Input
            label="Amount paid now (UGX)"
            type="number"
            min={0}
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary text-sm">
            Save purchase
          </button>
          {feedback ? <p className="text-xs font-bold text-navy">{feedback}</p> : null}
        </div>
      </form>

      <DataTable
        rows={purchases}
        rowKey={(p) => p.id}
        emptyMessage="No supplier purchases recorded yet."
        columns={[
          { key: "supplier", header: "Supplier", render: (p) => <span className="font-bold">{p.supplier_name}</span> },
          {
            key: "items",
            header: "Items",
            render: (p) => p.items.map((i) => `${i.name} × ${i.qty}`).join(", "),
          },
          { key: "total", header: "Total", align: "right", numeric: true, render: (p) => ugx(p.total) },
          {
            key: "balance",
            header: "Owed",
            align: "right",
            numeric: true,
            render: (p) => ugx(p.total - p.paid),
          },
        ]}
      />
    </div>
  );
}
