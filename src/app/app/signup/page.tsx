import { AuthForms } from "../../../components/platform/AuthForms";
import { StatusBadge } from "../../../components/site/StatusBadge";

export const metadata = { title: "Create workspace" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            Create your workspace
          </h1>
          <StatusBadge state="now" />
        </div>
        <p className="mt-2 text-sm text-navy/70">
          One business, one first shop, one owner account. Add extra branches after
          sign-in.
        </p>
      </header>
      <AuthForms mode="signup" />
    </div>
  );
}
