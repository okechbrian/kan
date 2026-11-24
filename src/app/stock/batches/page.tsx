import Link from "next/link";
import { BatchList } from "../../../components/commerce/BatchList";

export const metadata = { title: "Batches" };

export default function BatchesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-cream p-4">
      <header className="mb-5 flex items-center justify-between">
        <Link href="/stock" className="min-h-11 text-sm font-semibold text-kan">
          ← Stock
        </Link>
        <h1 className="text-lg font-bold">Batches & expiry</h1>
        <div className="w-12" />
      </header>
      <BatchList />
    </main>
  );
}
