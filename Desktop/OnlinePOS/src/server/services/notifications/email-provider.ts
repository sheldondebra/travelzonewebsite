import nodemailer from "nodemailer";
import type { BusinessSettings } from "@/lib/settings/defaults";
import type { PlatformOfficeMailConfig } from "@/lib/platform/notification-config";

export type MailSendConfig = BusinessSettings["mail"] & {
  smtpUser?: string;
  smtpPass?: string;
  resendApiKey?: string;
};

export function mergeMailConfig(
  tenant: BusinessSettings["mail"],
  platform: PlatformOfficeMailConfig | null,
): MailSendConfig {
  if (!platform?.enabled) return tenant;
  return {
    ...tenant,
    enabled: tenant.enabled || platform.enabled,
    fromName: platform.fromName || tenant.fromName,
    fromEmail: platform.fromEmail || tenant.fromEmail,
    smtpHost: platform.smtpHost || tenant.smtpHost,
    smtpPort: platform.smtpPort || tenant.smtpPort,
    smtpUser: platform.smtpUser,
    smtpPass: platform.smtpPass,
    resendApiKey: platform.resendApiKey,
  };
}

export async function sendBusinessEmail(
  mail: MailSendConfig,
  to: string,
  subject: string,
  text: string,
  html?: string,
): Promise<void> {
  if (!mail.enabled) {
    throw new Error("Email is disabled in settings");
  }
  if (!to?.trim()) {
    throw new Error("Customer has no email address");
  }

  const resendKey = mail.resendApiKey || process.env.RESEND_API_KEY;
  if (resendKey) {
    const from =
      mail.fromEmail && mail.fromName
        ? `${mail.fromName} <${mail.fromEmail}>`
        : mail.fromEmail || process.env.RESEND_FROM_EMAIL || "receipts@onboarding.resend.dev";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html: html ?? text.replace(/\n/g, "<br>"),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend email failed: ${err.slice(0, 200)}`);
    }
    return;
  }

  const host = mail.smtpHost || process.env.SMTP_HOST;
  const port = mail.smtpPort || Number(process.env.SMTP_PORT ?? 587);
  const user = mail.smtpUser || process.env.SMTP_USER;
  const pass = mail.smtpPass || process.env.SMTP_PASS;

  if (!host) {
    throw new Error(
      "Email not configured. Set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS in .env, or SMTP in Mail settings.",
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from:
      mail.fromEmail && mail.fromName
        ? `"${mail.fromName}" <${mail.fromEmail}>`
        : mail.fromEmail || user || "noreply@onlinepos.local",
    to,
    subject,
    text,
    html: html ?? `<pre style="font-family:sans-serif">${text}</pre>`,
  });
}
