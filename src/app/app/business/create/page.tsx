import Link from "next/link";
import { AuthForms } from "../../../../components/platform/AuthForms";
import { StatusBadge } from "../../../../components/site/StatusBadge";

export const metadata = { title: "Create business" };

export default function BusinessCreatePage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            Create your business
          </h1>
          <StatusBadge state="now" />
        </div>
        <p className="mt-2 text-sm text-navy/70">
          Start with one business and your first shop. You can pair counter phones and
          add branches next.
        </p>
      </header>
      <AuthForms mode="signup" />
      <p className="text-center text-xs text-navy/65">
        Already signed in?{" "}
        <Link href="/app/business/branch" className="font-bold text-navy underline">
          Manage branches →
        </Link>
      </p>
    </div>
  );
}
