import { Suspense } from "react";
import { DashboardView } from "./dashboard-view";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-center text-[13px] text-[#6B7280]">Loading your courses...</p>}>
      <DashboardView />
    </Suspense>
  );
}
