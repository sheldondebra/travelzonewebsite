"use client";

import { useSession } from "next-auth/react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { GeneralOfficeOverview } from "@/components/platform/general-office-overview";
import { isPlatformAdminUser } from "@/lib/platform/is-platform-admin";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <p className="px-4 py-8 text-sm text-muted-foreground">Loading dashboard…</p>
    );
  }

  if (session?.user && isPlatformAdminUser(session.user)) {
    return <GeneralOfficeOverview />;
  }

  return <DashboardStats />;
}
