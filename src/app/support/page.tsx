import Link from "next/link";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";

export const metadata = { title: "Support" };

const TOPICS = [
  {
    title: "I cannot sell",
    body: "Open the till from /pos. If there is no open shift, start one with the cash in the box. Selling does not need the internet.",
    href: "/pos",
    action: "Open the till",
  },
  {
    title: "I lost my records",
    body: "Until cloud sync is enabled, records live in this browser. Export a JSON backup regularly. Clearing browser data deletes the books.",
    href: "/more",
    action: "Go to More",
  },
  {
    title: "Stock or deni looks wrong",
    body: "Check the stock and customer screens on the till. Every sale, collection and adjustment is recorded; corrections use reason codes, never silent deletes.",
    href: "/stock",
    action: "Check stock",
  },
  {
    title: "I want an online store",
    body: "A preview storefront is available at /shop/demo-duuka. Real orders open when cloud sync is configured.",
    href: "/shop/demo-duuka",
    action: "See preview",
  },
];

export default function SupportPage() {
  return (
    <>
      <SiteHeader />
      <main className="section max-w-3xl">
        <p className="eyebrow">Support</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Help for the counter.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/60">
          Short answers to the problems that stop a shop day. Contact details are added
          when the support channel is confirmed.
        </p>
        <div className="mt-8 space-y-3">
          {TOPICS.map((topic) => (
            <section key={topic.title} className="card">
              <h2 className="text-base font-bold">{topic.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{topic.body}</p>
              <Link href={topic.href} className="btn-secondary mt-4 text-sm">
                {topic.action}
              </Link>
            </section>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/help" className="font-semibold text-kan underline">More FAQ</Link>
          <Link href="/privacy" className="font-semibold text-kan underline">Privacy</Link>
          <Link href="/terms" className="font-semibold text-kan underline">Terms</Link>
          <Link href="/account-deletion" className="font-semibold text-kan underline">
            Delete my data
          </Link>
        </div>
        <p className="mt-6 text-xs text-ink/40">
          Support contact: [to be confirmed]. Do not send passwords or PINs by email.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
