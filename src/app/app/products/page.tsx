import { SimplePage } from "../../../components/dashboard/SimplePage";

export default function ProductsPage() {
  return (
    <SimplePage
      title="Products"
      description="Catalogue, prices, stock levels and low-stock alerts."
      message="No products in the dashboard yet. Add stock from the till."
      state="now"
      action={{ label: "Go to stock", href: "/stock" }}
    />
  );
}
