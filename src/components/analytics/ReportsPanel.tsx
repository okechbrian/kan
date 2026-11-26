"use client";

import { ownerRows } from "../../lib/dashboard/access";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { db, type Customer, type ExpenseRecord, type Product, type PurchaseRecord, type StockTransfer, type User, type Warehouse } from "../../lib/db";
import { ugx } from "../../lib/money";
import {
  averageBasket,
  methodTotals,
  productPerformance,
  profitEstimate,
  salesByDay,
  type SaleLike,
} from "../../lib/analytics/sales";
import { stockAlerts } from "../../lib/analytics/alerts";
import {
  accountStatement,
  expensesByCategory,
  inventoryValuation,
  REPORT_KEYS,
  toCsv,
  type ReportKey,
} from "../../lib/analytics/suite";
import { DataTable, StatCard } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function ReportsPanel() {
  const [active, setActive] = useState<ReportKey>("sales-report");
  const [sales, setSales] = useState<SaleLike[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        saleRows,
        allTenders,
        allLines,
        custRows,
        expRows,
        cashMoves,
        prodRows,
        purRows,
        userRows,
        whRows,
        trRows,
      ] = await Promise.all([
        ownerRows(db.sales),
        ownerRows(db.tenders),
        ownerRows(db.sale_lines),
        ownerRows(db.customers),
        ownerRows(db.expenses),
        ownerRows(db.cash_movements),
        ownerRows(db.products),
        ownerRows(db.purchases),
        ownerRows(db.users),
        ownerRows(db.warehouses),
        ownerRows(db.stock_transfers),
      ]);

      const prodMap = new Map(prodRows.map((p) => [p.id, p]));
      setSales(
        saleRows.map((row) => ({
          id: row.id,
          created_at: row.created_at,
          status: row.status,
          total: row.total,
          tenders: allTenders
            .filter((t) => t.sale_id === row.id)
            .map((t) => ({ method: t.method, amount: t.amount })),
          lines: allLines
            .filter((l) => l.sale_id === row.id)
            .map((l) => ({
              productId: l.product_id,
              name: prodMap.get(l.product_id)?.name ?? l.product_id,
              qty: l.qty,
              unitPrice: l.unit_price,
              buyingPriceSnapshot: l.buying_price_snapshot,
              lineTotal: l.line_total,
            })),
        })),
      );
      const cashExpenses: ExpenseRecord[] = cashMoves
        .filter((m) => m.type === "expense" && !expRows.some((expense) => expense.id === m.id))
        .map((m) => ({
          id: m.id,
          shop_id: m.shop_id,
          category: "Cash drawer",
          amount: m.amount,
          description: m.reason,
          user_id: m.user_id,
          incurred_at: m.created_at,
        }));
      setExpenses([...expRows, ...cashExpenses]);
      setCustomers(custRows);
      setProducts(prodRows);
      setPurchases(purRows);
      setUsers(userRows);
      setWarehouses(whRows);
      setTransfers(trRows);
      setLoading(false);
    }
    void load();
  }, []);

  const computed = useMemo(() => {
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const completed = sales.filter((s) => s.status === "completed");
    const voided = sales.filter((s) => s.status === "voided");
    return {
      totalSales: completed.reduce((sum, s) => sum + s.total, 0),
      completedCount: completed.length,
      basket: averageBasket(sales),
      methods: methodTotals(sales),
      topProducts: productPerformance(sales),
      profit: profitEstimate(sales, totalExp),
      days: salesByDay(sales).slice(-14),
      valuation: inventoryValuation(products),
      expCats: expensesByCategory(expenses),
      statement: accountStatement({ sales, expenses, purchases }),
      voided,
      lowStock: stockAlerts(products),
    };
  }, [sales, expenses, products, purchases]);

  function exportActiveCsv() {
    let csv = "";
    if (active === "sales-report") {
      csv = toCsv(
        ["Date", "Sales count", "Total UGX"],
        computed.days.map((d) => [d.day, d.count, d.total]),
      );
    } else if (active === "inventory-overview") {
      csv = toCsv(
        ["Product", "Qty", "Buy UGX", "Sell UGX"],
        products.map((p) => [p.name, p.stock_qty, p.buying_price, p.selling_price]),
      );
    } else if (active === "expense-overview") {
      csv = toCsv(
        ["Category", "Entries", "Total UGX"],
        computed.expCats.map((c) => [c.category, c.count, c.total]),
      );
    } else {
      csv = toCsv(
        ["Metric", "Value UGX"],
        [
          ["Gross sales", computed.statement.grossSales],
          ["Voided sales", computed.statement.voidedTotal],
          ["Expenses", computed.statement.totalExpenses],
          ["Purchases paid", computed.statement.purchasesPaid],
          ["Net cash flow", computed.statement.netCashFlow],
        ],
      );
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kan-${active}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="py-8 text-sm text-navy/60">Loading 12 analytics reports...</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">
              Analytics & 12 reports
            </h1>
            <StatusBadge state="now" />
          </div>
          <p className="mt-1 text-sm text-navy/65">
            All 12 operational reports computed in integer UGX from your shop ledger.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportActiveCsv} className="btn-secondary gap-1.5 text-xs">
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-primary gap-1.5 text-xs"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Analytics reports">
        {REPORT_KEYS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`min-h-10 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              active === tab.id
                ? "bg-navy text-softwhite"
                : "border border-navy/15 bg-white text-navy hover:bg-teal-soft"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "sales-report" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Gross sales" value={ugx(computed.totalSales)} />
            <StatCard label="Completed sales" value={String(computed.completedCount)} />
            <StatCard label="Average basket" value={ugx(computed.basket)} />
            <StatCard label="Profit estimate" value={ugx(computed.profit)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DataTable
              rows={computed.methods}
              rowKey={(m) => m.method}
              emptyMessage="No tender totals recorded yet."
              columns={[
                { key: "method", header: "Payment method", render: (m) => m.method.replace(/_/g, " ") },
                { key: "amount", header: "Total", align: "right", numeric: true, render: (m) => ugx(m.amount) },
              ]}
            />
            <DataTable
              rows={computed.topProducts.slice(0, 8)}
              rowKey={(p) => p.productId}
              emptyMessage="No product sales yet."
              columns={[
                { key: "name", header: "Product", render: (p) => p.name },
                { key: "qty", header: "Qty", align: "right", numeric: true, render: (p) => String(p.qty) },
                { key: "rev", header: "Revenue", align: "right", numeric: true, render: (p) => ugx(p.revenue) },
              ]}
            />
          </div>
        </div>
      ) : null}

      {active === "transaction-overview" ? (
        <DataTable
          rows={sales}
          rowKey={(s) => s.id}
          emptyMessage="No transactions recorded yet."
          columns={[
            { key: "date", header: "Date", render: (s) => s.created_at.slice(0, 16).replace("T", " ") },
            { key: "status", header: "Status", render: (s) => s.status },
            { key: "total", header: "Total", align: "right", numeric: true, render: (s) => ugx(s.total) },
          ]}
        />
      ) : null}

      {active === "customer-overview" ? (
        <DataTable
          rows={customers}
          rowKey={(c) => c.id}
          emptyMessage="No customers recorded yet."
          columns={[
            { key: "name", header: "Customer", render: (c) => c.name },
            { key: "phone", header: "Phone", render: (c) => c.phone || "—" },
            { key: "balance", header: "Deni owed", align: "right", numeric: true, render: (c) => ugx(c.balance) },
          ]}
        />
      ) : null}

      {active === "expense-overview" ? (
        <DataTable
          rows={computed.expCats}
          rowKey={(c) => c.category}
          emptyMessage="No expenses recorded yet."
          columns={[
            { key: "cat", header: "Category", render: (c) => c.category },
            { key: "count", header: "Entries", align: "right", numeric: true, render: (c) => String(c.count) },
            { key: "total", header: "Total", align: "right", numeric: true, render: (c) => ugx(c.total) },
          ]}
        />
      ) : null}

      {active === "inventory-overview" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total units in stock" value={String(computed.valuation.totalUnits)} />
            <StatCard label="Stock value (cost)" value={ugx(computed.valuation.costValue)} />
            <StatCard label="Stock value (retail)" value={ugx(computed.valuation.retailValue)} />
          </div>
          <DataTable
            rows={products}
            rowKey={(p) => p.id}
            emptyMessage="No inventory items yet."
            columns={[
              { key: "name", header: "Product", render: (p) => p.name },
              { key: "qty", header: "Qty", align: "right", numeric: true, render: (p) => String(p.stock_qty) },
              { key: "buy", header: "Buy", align: "right", numeric: true, render: (p) => ugx(p.buying_price) },
              { key: "sell", header: "Sell", align: "right", numeric: true, render: (p) => ugx(p.selling_price) },
            ]}
          />
        </div>
      ) : null}

      {active === "purchase-overview" ? (
        <DataTable
          rows={purchases}
          rowKey={(p) => p.id}
          emptyMessage="No supplier purchases recorded yet."
          columns={[
            { key: "supplier", header: "Supplier", render: (p) => p.supplier_name },
            { key: "total", header: "Total", align: "right", numeric: true, render: (p) => ugx(p.total) },
            { key: "paid", header: "Paid", align: "right", numeric: true, render: (p) => ugx(p.paid) },
          ]}
        />
      ) : null}

      {active === "refund-overview" ? (
        <DataTable
          rows={computed.voided}
          rowKey={(v) => v.id}
          emptyMessage="No voided or refunded sales."
          columns={[
            { key: "date", header: "Date", render: (v) => v.created_at.slice(0, 16).replace("T", " ") },
            { key: "total", header: "Reversed amount", align: "right", numeric: true, render: (v) => ugx(v.total) },
          ]}
        />
      ) : null}

      {active === "staff-overview" ? (
        <DataTable
          rows={users}
          rowKey={(u) => u.id}
          emptyMessage="No staff PIN users found."
          columns={[
            { key: "name", header: "Staff", render: (u) => u.name },
            { key: "role", header: "Role", render: (u) => u.role },
            { key: "active", header: "Active", render: (u) => (u.active ? "Yes" : "No") },
          ]}
        />
      ) : null}

      {active === "warehouse-overview" ? (
        <DataTable
          rows={warehouses}
          rowKey={(w) => w.id}
          emptyMessage="No warehouse locations configured yet."
          columns={[
            { key: "name", header: "Location", render: (w) => w.name },
            { key: "active", header: "Status", render: (w) => (w.active ? "Active" : "Inactive") },
          ]}
        />
      ) : null}

      {active === "warehouse-restock" ? (
        <DataTable
          rows={computed.lowStock}
          rowKey={(a) => a.productId}
          emptyMessage="No products currently below reorder level."
          columns={[
            { key: "name", header: "Product", render: (a) => a.name },
            { key: "qty", header: "Remaining", align: "right", numeric: true, render: (a) => String(a.quantity) },
            { key: "level", header: "Priority", render: (a) => a.level.toUpperCase() },
          ]}
        />
      ) : null}

      {active === "warehouse-transfers" ? (
        <DataTable
          rows={transfers}
          rowKey={(t) => t.id}
          emptyMessage="No inter-branch stock transfers recorded."
          columns={[
            { key: "date", header: "Date", render: (t) => t.created_at.slice(0, 10) },
            { key: "lines", header: "Items", align: "right", numeric: true, render: (t) => String(t.lines.length) },
            { key: "status", header: "Status", render: (t) => t.status },
          ]}
        />
      ) : null}

      {active === "view-statement" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Gross sales" value={ugx(computed.statement.grossSales)} />
          <StatCard label="Voided / refunds" value={ugx(computed.statement.voidedTotal)} deltaTone="guava" />
          <StatCard label="Expenses" value={ugx(computed.statement.totalExpenses)} deltaTone="guava" />
          <StatCard label="Purchases paid" value={ugx(computed.statement.purchasesPaid)} />
          <StatCard
            label="Net cash flow"
            value={ugx(computed.statement.netCashFlow)}
            deltaTone={computed.statement.netCashFlow >= 0 ? "teal" : "guava"}
          />
        </div>
      ) : null}
    </div>
  );
}
