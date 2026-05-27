"use client";

import { SettingsPageShell } from "@/components/settings/settings-shell";
import { TextField, Toggle } from "@/components/settings/fields";

export default function MailSettingsPage() {
  return (
    <SettingsPageShell
      title="Mail settings"
      description="SMTP configuration for transactional email"
      section="mail"
    >
      {(s, u) => (
        <>
          <Toggle
            label="Enable email"
            checked={s.mail.enabled}
            onChange={(v) => u({ enabled: v })}
          />
          <TextField
            label="From name"
            value={s.mail.fromName}
            onChange={(v) => u({ fromName: v })}
          />
          <TextField
            label="From email"
            value={s.mail.fromEmail}
            onChange={(v) => u({ fromEmail: v })}
          />
          <TextField
            label="SMTP host"
            value={s.mail.smtpHost}
            onChange={(v) => u({ smtpHost: v })}
          />
          <TextField
            label="SMTP port"
            type="number"
            value={s.mail.smtpPort}
            onChange={(v) => u({ smtpPort: Number(v) })}
          />
          <p className="text-xs text-muted-foreground">
            Or set <code className="rounded bg-muted px-1">RESEND_API_KEY</code> in .env
            for instant email without SMTP.
          </p>
        </>
      )}
    </SettingsPageShell>
  );
}
