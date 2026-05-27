import { SettingsPageShell } from "@/components/settings/settings-shell";
import { SmsTemplateEditor } from "@/components/sms/sms-template-editor";

export default function SmsTemplatesPage() {
  return (
    <SettingsPageShell
      title="SMS templates"
      description="Customize automated SMS messages for receipts, delivery, and alerts"
      section="smsTemplates"
    >
      {() => <SmsTemplateEditor />}
    </SettingsPageShell>
  );
}
