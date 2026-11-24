import Link from "next/link";
import { PaymentsPanel } from "../../../components/payments/PaymentsPanel";

export const metadata = { title: "Payments" };

export default function PaymentsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-gray-50 p-4 pb-20">
      <header className="mb-5 flex items-center gap-3">
        <Link href="/more" className="min-h-11 text-sm font-semibold text-blue-600">
          ← More
        </Link>
        <h1 className="text-lg font-bold">Payments</h1>
      </header>
      <PaymentsPanel />
    </main>
  );
}
