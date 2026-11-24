import type { ReactNode } from "react";
import { DashboardChrome } from "../../components/dashboard/DashboardChrome";

export const metadata = {
  title: "Dashboard",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <DashboardChrome>{children}</DashboardChrome>;
}
