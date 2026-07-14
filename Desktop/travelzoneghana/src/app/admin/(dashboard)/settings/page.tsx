import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { appUrl } from "@/lib/paystack";
import { getSplitSmsBalance } from "@/lib/splitsms";
import { getAdminSettingsView } from "@/lib/site-settings";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getAdminSettingsView();
  const splitSmsBalanceResult = settings.status.splitsmsReady
    ? await getSplitSmsBalance()
    : null;

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Paystack, SplitSMS, SMTP, and notification preferences."
      />
      <SettingsForm
        settings={settings}
        webhookUrl={`${appUrl()}/api/paystack/webhook`}
        splitSmsBalance={
          splitSmsBalanceResult?.ok ? splitSmsBalanceResult.balance : null
        }
        splitSmsBalanceError={
          splitSmsBalanceResult && !splitSmsBalanceResult.ok
            ? splitSmsBalanceResult.error
            : null
        }
      />
    </>
  );
}
