"use client";

import { SettingsPageShell } from "@/components/settings/settings-shell";
import { TextAreaField } from "@/components/settings/fields";

export default function EmailTemplatesPage() {
  return (
    <SettingsPageShell
      title="Email templates"
      description="Templates for automated emails"
      section="emailTemplates"
    >
      {(s, u) => (
        <>
          <TextAreaField
            label="Welcome email"
            value={s.emailTemplates.welcomeEmail}
            onChange={(v) => u({ welcomeEmail: v })}
          />
          <TextAreaField
            label="Receipt email subject"
            value={s.emailTemplates.orderReceiptSubject}
            onChange={(v) => u({ orderReceiptSubject: v })}
          />
          <TextAreaField
            label="POS receipt email body (sent instantly after sale)"
            value={s.emailTemplates.orderReceipt}
            onChange={(v) => u({ orderReceipt: v })}
          />
        </>
      )}
    </SettingsPageShell>
  );
}
