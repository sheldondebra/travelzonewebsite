"use client";

import { AdminDashboardView } from "@/components/edamad/admin-dashboard-view";
import { useAdminSearch } from "@/components/layout/admin-shell";

export default function AdminDashboardPage() {
  const { searchQuery } = useAdminSearch();
  return <AdminDashboardView searchQuery={searchQuery} />;
}
