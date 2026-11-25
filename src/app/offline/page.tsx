import Link from "next/link";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-kan text-3xl font-black text-white">
        K
      </span>
      <h1 className="text-2xl font-black text-ink">You are offline</h1>
      <p className="max-w-sm text-sm leading-relaxed text-ink/60">
        Pages you have already opened may still work. Open the till to keep selling — a
        failed connection never blocks a sale.
      </p>
      <Link href="/pos" className="btn-primary">
        Open the till
      </Link>
    </main>
  );
}
