"use client";

import { ownerRows, ownerContext } from "../../lib/dashboard/access";

import { useEffect, useState, type FormEvent } from "react";
import { CalendarCheck } from "lucide-react";
import { db, type BookingRecord } from "../../lib/db";
import { ugx } from "../../lib/money";
import { generateId } from "../../lib/uuid";
import { DataTable, Input } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function BookingsPanel() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [shopId, setShopId] = useState("default-shop");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState("45");
  const [depositUgx, setDepositUgx] = useState("0");
  const [feedback, setFeedback] = useState("");

  async function load() {
    const [shops, rows] = await Promise.all([ownerRows(db.shops), ownerRows(db.bookings)]);
    setShopId(shops[0]?.id ?? "default-shop");
    setBookings(rows.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)));
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await ownerContext(shopId);
    setFeedback("");
    const duration = Number(durationMin || "30");
    const deposit = Number(depositUgx || "0");
    if (!customerName.trim() || !serviceName.trim() || !scheduledAt) {
      setFeedback("Customer name, service and appointment date/time are required.");
      return;
    }
    if (!Number.isInteger(duration) || duration <= 0 || !Number.isInteger(deposit) || deposit < 0) {
      setFeedback("Duration and deposit (UGX) must be non-negative integers.");
      return;
    }
    await db.bookings.add({
      id: generateId(),
      shop_id: shopId,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      service_name: serviceName.trim(),
      staff_name: staffName.trim(),
      scheduled_at: scheduledAt,
      duration_min: duration,
      deposit_ugx: deposit,
      status: "scheduled",
      created_at: new Date().toISOString(),
    });
    setCustomerName("");
    setCustomerPhone("");
    setServiceName("");
    setStaffName("");
    setScheduledAt("");
    setDurationMin("45");
    setDepositUgx("0");
    setFeedback("Appointment booked.");
    await load();
  }

  async function updateStatus(id: string, status: BookingRecord["status"]) {
    await ownerContext(shopId);
    await db.bookings.update(id, { status });
    await load();
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            Bookings & appointments
          </h1>
          <StatusBadge state="now" />
        </div>
        <p className="mt-1 text-sm text-navy/65">
          Schedule service slots, staff assignments and UGX booking deposits for salons,
          spas, tailors and laundries.
        </p>
      </header>

      <form onSubmit={handleCreate} className="card space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy">
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          New booking
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Customer name"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Brenda Namazzi"
          />
          <Input
            label="Phone (+256)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="0791149592"
          />
          <Input
            label="Service"
            required
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="e.g. Hair braiding / Suit press"
          />
          <Input
            label="Staff member"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            placeholder="e.g. Miriam"
          />
          <Input
            label="Date & time"
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <Input
            label="Duration (min)"
            type="number"
            min={5}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          />
          <Input
            label="Deposit (UGX)"
            type="number"
            min={0}
            value={depositUgx}
            onChange={(e) => setDepositUgx(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary text-sm">
            Book slot
          </button>
          {feedback ? <p className="text-xs font-bold text-navy">{feedback}</p> : null}
        </div>
      </form>

      <DataTable
        rows={bookings}
        rowKey={(b) => b.id}
        emptyMessage="No service bookings scheduled yet."
        columns={[
          {
            key: "when",
            header: "When",
            render: (b) => <span className="text-xs">{b.scheduled_at.replace("T", " ")}</span>,
          },
          {
            key: "customer",
            header: "Customer & service",
            render: (b) => (
              <div>
                <p className="font-bold text-navy">{b.customer_name}</p>
                <p className="text-xs text-navy/60">
                  {b.service_name} {b.staff_name ? `· ${b.staff_name}` : ""} ({b.duration_min}m)
                </p>
              </div>
            ),
          },
          {
            key: "deposit",
            header: "Deposit",
            align: "right",
            numeric: true,
            render: (b) => ugx(b.deposit_ugx),
          },
          {
            key: "status",
            header: "Status",
            render: (b) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[11px] font-bold uppercase text-navy">
                  {b.status}
                </span>
                {b.status === "scheduled" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void updateStatus(b.id, "completed")}
                      className="rounded-lg border border-navy/15 px-2 py-1 text-[11px] font-bold text-navy hover:bg-teal-soft"
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateStatus(b.id, "cancelled")}
                      className="rounded-lg border border-navy/15 px-2 py-1 text-[11px] font-bold text-navy hover:bg-guava-soft"
                    >
                      Cancel
                    </button>
                  </>
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
