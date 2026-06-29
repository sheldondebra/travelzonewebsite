import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { appUrl } from "@/lib/paystack";
import { getSplitSmsBalance } from "@/lib/splitsms";
import { getAdminSettingsView } from "@/lib/site-settings";
import { requireAdmin } from "@/lib/supabase/auth";

function SettingsFormFallback() {
  return (
    <div className="admin-postbox p-6 text-[13px] text-[#646970]">Loading settings…</div>
  );
}

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
        description="Payments, SMS, email, and notification preferences for your site."
      />
      <Suspense fallback={<SettingsFormFallback />}>
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
      </Suspense>
    </>
  );
}
