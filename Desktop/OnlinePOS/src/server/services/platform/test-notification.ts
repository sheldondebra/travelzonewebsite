import { logNotification } from "@/server/services/notifications/log-notification";
import {
  mergeMailConfig,
  sendBusinessEmail,
} from "@/server/services/notifications/email-provider";
import {
  mergeSmsConfig,
  sendBusinessSms,
} from "@/server/services/notifications/sms-provider";
import { getPlatformOfficeConfigRaw } from "@/server/services/platform/platform-office-store";

export async function sendPlatformTestSms(to: string, body?: string) {
  const platform = await getPlatformOfficeConfigRaw();
  const sms = mergeSmsConfig(
    {
      enabled: true,
      provider: platform.sms.provider,
      apiKey: "",
      senderId: platform.sms.senderId,
    },
    platform.sms,
  );

  const message =
    body ??
    `[General Office test] SMS from ${platform.sms.senderId || "OnlinePOS"} at ${new Date().toLocaleString()}`;

  await sendBusinessSms(sms, to, message);
  await logNotification({
    businessId: null,
    channel: "sms",
    recipient: to,
    status: "sent",
    message: "Platform test SMS",
    source: "platform_test",
  });
}

export async function sendPlatformTestEmail(to: string, subject?: string) {
  const platform = await getPlatformOfficeConfigRaw();
  const mail = mergeMailConfig(
    {
      enabled: true,
      fromName: platform.mail.fromName,
      fromEmail: platform.mail.fromEmail,
      smtpHost: platform.mail.smtpHost,
      smtpPort: platform.mail.smtpPort,
    },
    platform.mail,
  );

  const subj = subject ?? `[General Office] Test email ${new Date().toLocaleString()}`;
  const text =
    "This is a test email from Tecunit General Office notification settings.\n\nIf you received this, mail is configured correctly.";

  await sendBusinessEmail(mail, to, subj, text);
  await logNotification({
    businessId: null,
    channel: "email",
    recipient: to,
    status: "sent",
    subject: subj,
    message: "Platform test email",
    source: "platform_test",
  });
}
