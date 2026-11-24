import { SimplePage } from "../../../components/dashboard/SimplePage";

export default function BillingPage() {
  return (
    <SimplePage
      title="Billing"
      description="Plans, invoices and usage limits."
      message="Billing opens with the platform release. Prices shown on /pricing are indicative."
      state="soon"
      action={{ label: "See indicative plans", href: "/pricing" }}
    />
  );
}
