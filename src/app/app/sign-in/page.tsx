import { AuthForms } from "../../../components/platform/AuthForms";
import { StatusBadge } from "../../../components/site/StatusBadge";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight">Sign in</h1>
          <StatusBadge state="soon" />
        </div>
        <p className="mt-2 text-sm text-ink/60">
          Accounts open when cloud sync is configured. The till does not need an account.
        </p>
      </header>
      <AuthForms mode="sign-in" />
    </div>
  );
}
