import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { AdminSetupBanner } from "@/components/admin/AdminSetupBanner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getSplitSmsBalance } from "@/lib/splitsms";
import { getAdminSettingsView } from "@/lib/site-settings";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await requireStaff();
  const settings = await getAdminSettingsView();
  const splitSmsBalanceResult = settings.status.splitsmsReady
    ? await getSplitSmsBalance()
    : null;

  return (
    <AdminLayoutClient
      email={user.email ?? "Staff"}
      role={role}
      splitsmsReady={settings.status.splitsmsReady}
      smsBalance={splitSmsBalanceResult?.ok ? splitSmsBalanceResult.balance : null}
      smsBalanceError={
        splitSmsBalanceResult && !splitSmsBalanceResult.ok
          ? splitSmsBalanceResult.error
          : null
      }
      sidebar={<AdminSidebar role={role} />}
    >
      <AdminSetupBanner />
      {children}
    </AdminLayoutClient>
  );
}
