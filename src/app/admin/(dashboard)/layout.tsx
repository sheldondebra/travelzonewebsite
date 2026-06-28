import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { AdminSetupBanner } from "@/components/admin/AdminSetupBanner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await requireStaff();

  return (
    <AdminLayoutClient
      email={user.email ?? "Staff"}
      sidebar={<AdminSidebar role={role} />}
    >
      <AdminSetupBanner />
      {children}
    </AdminLayoutClient>
  );
}
