"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db, type User } from "../../lib/db";
import { ugx } from "../../lib/money";
import { DataTable } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

type StaffSummary = User & { saleCount: number; salesTotal: number };

export function StaffPanel() {
  const [staff, setStaff] = useState<StaffSummary[]>([]);

  useEffect(() => {
    async function load() {
      const [users, sales] = await Promise.all([db.users.toArray(), db.sales.toArray()]);
      const stats = new Map<string, { count: number; total: number }>();
      for (const s of sales) {
        if (s.status !== "completed") continue;
        const cur = stats.get(s.user_id) ?? { count: 0, total: 0 };
        cur.count += 1;
        cur.total += s.total;
        stats.set(s.user_id, cur);
      }
      setStaff(
        users.map((u) => {
          const st = stats.get(u.id) ?? { count: 0, total: 0 };
          return { ...u, saleCount: st.count, salesTotal: st.total };
        }),
      );
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">
              Staff & activity
            </h1>
            <StatusBadge state="now" />
          </div>
          <p className="mt-1 text-sm text-navy/65">
            PIN-based counter attendants and owner roles, with completed sales per person.
          </p>
        </div>
        <Link href="/settings/users" className="btn-primary text-xs">
          Manage till PIN users
        </Link>
      </header>

      <DataTable
        rows={staff}
        rowKey={(u) => u.id}
        emptyMessage="No till users seeded yet. Open the till setup to create your owner PIN."
        columns={[
          {
            key: "name",
            header: "Staff member",
            render: (u) => <span className="font-bold text-navy">{u.name}</span>,
          },
          {
            key: "role",
            header: "Role",
            render: (u) => (
              <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[11px] font-bold uppercase text-navy">
                {u.role}
              </span>
            ),
          },
          {
            key: "count",
            header: "Sales",
            align: "right",
            numeric: true,
            render: (u) => String(u.saleCount),
          },
          {
            key: "total",
            header: "Total sold",
            align: "right",
            numeric: true,
            render: (u) => ugx(u.salesTotal),
          },
        ]}
      />
    </div>
  );
}
