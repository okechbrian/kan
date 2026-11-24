import Link from "next/link";
import { TransferForm } from "../../../components/commerce/TransferForm";

export const metadata = { title: "Transfer stock" };

export default function TransferPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-cream p-4">
      <header className="mb-5 flex items-center justify-between">
        <Link href="/stock" className="min-h-11 text-sm font-semibold text-kan">
          ← Stock
        </Link>
        <h1 className="text-lg font-bold">Move stock</h1>
        <div className="w-12" />
      </header>
      <p className="mb-4 text-xs text-ink/50">
        Recorded locally and applied when sync is available. Negative stock is allowed
        with a warning; a sale is never blocked.
      </p>
      <TransferForm />
    </main>
  );
}
