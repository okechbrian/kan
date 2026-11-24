import { SimplePage } from "../../../components/dashboard/SimplePage";

export default function CustomersPage() {
  return (
    <SimplePage
      title="Customers"
      description="Phone-first records, deni balances and collection history."
      message="No customers in the dashboard yet. Credit customers are added on the till."
      state="now"
      action={{ label: "Go to customers", href: "/customers" }}
    />
  );
}
