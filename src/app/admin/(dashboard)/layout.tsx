import { AdminHeader } from "@/components/admin/AdminHeader";
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
    <div className="admin-shell flex min-h-screen flex-col">
      <AdminHeader email={user.email ?? "Staff"} />
      <div className="flex min-h-0 flex-1">
        <AdminSidebar role={role} />
        <main className="admin-content">
          <AdminSetupBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
