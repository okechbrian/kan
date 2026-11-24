import { SimplePage } from "../../../components/dashboard/SimplePage";

export default function OrdersPage() {
  return (
    <SimplePage
      title="Orders"
      description="Counter sales and, later, online store orders in one list."
      message="No online orders yet. Your storefront opens with the online store release."
      state="soon"
    />
  );
}
