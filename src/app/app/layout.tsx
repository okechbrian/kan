import type { ReactNode } from "react";
import { DashboardChrome } from "../../components/dashboard/DashboardChrome";
import { OwnerBoundary } from "../../components/dashboard/OwnerBoundary";

export const metadata = {
  title: "Dashboard",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <DashboardChrome><OwnerBoundary>{children}</OwnerBoundary></DashboardChrome>;
}
