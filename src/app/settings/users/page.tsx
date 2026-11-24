"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, type User } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/session";
import { hashPin } from "../../../lib/pin";
import { generateId } from "../../../lib/uuid";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetPin, setResetPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user || user.role !== "owner") {
        router.replace("/more");
        return;
      }
      const items = await db.users
        .where("shop_id")
        .equals(user.shopId)
        .toArray();
      setUsers(items);
      setLoading(false);
    }
    load();
  }, [router]);

  const handleAdd = async () => {
    const session = await getCurrentUser();
    if (!session || session.role !== "owner" || saving) return;
    if (!newName.trim() || newPin.length < 4) return;

    setSaving(true);
    try {
      const pinHash = await hashPin(newPin);
      await db.users.add({
        id: generateId(),
        business_id: session.shopId.split("-")[0] || session.shopId,
        shop_id: session.shopId,
        name: newName.trim(),
        role: "attendant",
        pin_hash: pinHash,
        active: true,
        server_updated_at: new Date().toISOString(),
      });
      setNewName("");
      setNewPin("");
      setShowAdd(false);
      setToast("Attendant added");
      setTimeout(() => setToast(""), 2000);

      const items = await db.users
        .where("shop_id")
        .equals(session.shopId)
        .toArray();
      setUsers(items);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPin = async () => {
    if (!resetUser || saving) return;
    if (resetPin.length < 4) return;

    setSaving(true);
    try {
      const pinHash = await hashPin(resetPin);
      await db.users.where("id").equals(resetUser.id).modify((u) => {
        u.pin_hash = pinHash;
      });
      setResetUser(null);
      setResetPin("");
      setToast("PIN reset");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    await db.users.where("id").equals(user.id).modify((u) => {
      u.active = !u.active;
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium"
          >
            Back
          </button>
          <h1 className="text-lg font-bold">Users & PINs</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading...</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.role === "attendant" && (
                    <>
                      <button
                        onClick={() => {
                          setResetUser(u);
                          setResetPin("");
                        }}
                        className="text-xs text-blue-600 underline"
                      >
                        Reset PIN
                      </button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`text-xs px-2 py-1 rounded ${
                          u.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {u.active ? "Active" : "Inactive"}
                      </button>
                    </>
                  )}
                  {u.role === "owner" && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Owner
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full rounded-lg border border-blue-300 py-2.5 text-blue-700 font-medium text-sm active:bg-blue-50"
          >
            + Add attendant
          </button>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="font-medium text-sm">New attendant</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="PIN (4-6 digits)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700 active:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || newPin.length < 4 || saving}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-white text-sm font-medium active:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reset PIN modal */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4 pb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Reset PIN</h2>
              <button
                onClick={() => setResetUser(null)}
                className="text-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              New PIN for {resetUser.name}
            </p>
            <input
              type="password"
              value={resetPin}
              onChange={(e) => setResetPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="New PIN (4-6 digits)"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mb-3"
            />
            <button
              onClick={handleResetPin}
              disabled={resetPin.length < 4 || saving}
              className="w-full rounded-lg bg-blue-600 py-3 text-white text-lg font-semibold active:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300"
            >
              {saving ? "Saving..." : "Reset PIN"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}
    </main>
  );
}
