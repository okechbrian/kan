import { AuthForms } from "../../../components/platform/AuthForms";
import { StatusBadge } from "../../../components/site/StatusBadge";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Sign in</h1>
          <StatusBadge state="now" />
        </div>
        <p className="mt-2 text-sm text-navy/70">
          Sign in to manage branches, reports and your online store. Counter attendants
          continue using a PIN at the till.
        </p>
      </header>
      <AuthForms mode="sign-in" />
    </div>
  );
}
