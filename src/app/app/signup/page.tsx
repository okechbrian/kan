import { AuthForms } from "../../../components/platform/AuthForms";
import { StatusBadge } from "../../../components/site/StatusBadge";

export const metadata = { title: "Create workspace" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight">Create your workspace</h1>
          <StatusBadge state="soon" />
        </div>
        <p className="mt-2 text-sm text-ink/60">
          One business, one first shop, one owner account. Add branches after sign-in.
        </p>
      </header>
      <AuthForms mode="signup" />
    </div>
  );
}
