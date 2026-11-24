import { SimplePage } from "../../../components/dashboard/SimplePage";

export default function SettingsPage() {
  return (
    <SimplePage
      title="Settings"
      description="Shop name, MoMo number, PINs and backup."
      message="Settings are managed on the till for now."
      state="now"
      action={{ label: "Go to settings", href: "/settings" }}
    />
  );
}
