import { Suspense } from "react";
import { BranchPairingPanel } from "../../../../components/platform/BranchPairingPanel";
export const metadata = { title: "Connect branch till" };
export default function BranchPairingPage() {
  return <Suspense fallback={<p>Loading branch…</p>}><BranchPairingPanel /></Suspense>;
}
