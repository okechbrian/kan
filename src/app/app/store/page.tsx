import Link from "next/link";
import { EmptyPanel } from "../../../components/dashboard/EmptyPanel";
import { StatusBadge } from "../../../components/site/StatusBadge";

export const metadata = { title: "Online store" };

export default function StorePage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight">Online store</h1>
          <StatusBadge state="soon" />
        </div>
        <p className="mt-2 text-sm text-ink/60">
          A shareable storefront that stays in sync with your stock.
        </p>
      </header>
      <EmptyPanel
        title="Storefront preview"
        message="Open /shop/demo-duuka to see how your public storefront will look. Online ordering opens with cloud sync."
        state="soon"
        action={
          <Link href="/shop/demo-duuka" className="btn-secondary text-sm">
            Open the preview
          </Link>
        }
      />
    </div>
  );
}
