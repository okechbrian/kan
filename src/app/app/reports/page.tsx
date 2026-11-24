import { SimplePage } from "../../../components/dashboard/SimplePage";

export default function ReportsPage() {
  return (
    <SimplePage
      title="Reports"
      description="Today, who owes, profit estimate and the till close."
      message="Reports appear after the first closed shift."
      state="soon"
      action={{ label: "Close a shift", href: "/shift/close" }}
    />
  );
}
