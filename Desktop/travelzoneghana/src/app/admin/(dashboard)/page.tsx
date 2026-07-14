import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getDashboardStats } from "@/lib/content-admin";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user, role } = await requireStaff();
  const { error } = await searchParams;
  const stats = await getDashboardStats();

  return (
    <AdminDashboard
      stats={stats}
      role={role}
      email={user.email ?? "Staff"}
      forbidden={error === "forbidden"}
    />
  );
}
