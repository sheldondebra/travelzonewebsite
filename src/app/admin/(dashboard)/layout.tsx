import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { AdminSetupBanner } from "@/components/admin/AdminSetupBanner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getDashboardStats } from "@/lib/content-admin";
import { getSplitSmsBalance, type SplitSmsBalance } from "@/lib/splitsms";
import { getAdminSettingsView } from "@/lib/site-settings";
import { requireStaff } from "@/lib/auth/staff";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await requireStaff();

  let splitsmsReady = false;
  let smsBalance: SplitSmsBalance | null = null;
  let smsBalanceError: string | null = null;
  let notifications = {
    pendingBookings: 0,
    pendingTicketRequests: 0,
    pendingConsultations: 0,
    pendingMessages: 0,
  };

  try {
    const settings = await getAdminSettingsView();
    splitsmsReady = settings.status.splitsmsReady;
    const splitSmsBalanceResult = settings.status.splitsmsReady
      ? await getSplitSmsBalance()
      : null;
    smsBalance = splitSmsBalanceResult?.ok ? splitSmsBalanceResult.balance : null;
    smsBalanceError =
      splitSmsBalanceResult && !splitSmsBalanceResult.ok
        ? splitSmsBalanceResult.error
        : null;
  } catch {
    splitsmsReady = false;
    smsBalance = null;
    smsBalanceError = null;
  }

  try {
    const stats = await getDashboardStats();
    notifications = {
      pendingBookings: stats.pendingBookings,
      pendingTicketRequests: stats.pendingTicketRequests,
      pendingConsultations: stats.pendingConsultations,
      pendingMessages: stats.pendingMessages,
    };
  } catch {
    // Keep the shell usable if notification counts fail.
  }

  return (
    <AdminLayoutClient
      email={user.email ?? "Staff"}
      role={role}
      splitsmsReady={splitsmsReady}
      smsBalance={smsBalance}
      smsBalanceError={smsBalanceError}
      notifications={notifications}
      sidebar={<AdminSidebar role={role} />}
    >
      <AdminSetupBanner />
      {children}
    </AdminLayoutClient>
  );
}
