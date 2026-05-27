import type { BusinessSettings } from "@/lib/settings/defaults";
import type { PlatformOfficeSmsConfig } from "@/lib/platform/notification-config";

export type SmsSendConfig = BusinessSettings["sms"] & {
  hubtelClientId?: string;
  hubtelClientSecret?: string;
};

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

/** Hubtel SMS — https://developers.hubtel.com/docs/sms */
async function sendHubtelSms(
  config: SmsSendConfig,
  to: string,
  content: string,
): Promise<void> {
  const clientId =
    config.hubtelClientId ||
    process.env.HUBTEL_CLIENT_ID ||
    process.env.HUBTEL_SMS_CLIENT_ID;
  const clientSecret =
    config.hubtelClientSecret ||
    process.env.HUBTEL_CLIENT_SECRET ||
    process.env.HUBTEL_SMS_CLIENT_SECRET;
  const apiKey = config.apiKey || process.env.HUBTEL_SMS_API_KEY;

  if (!clientId || !clientSecret) {
    if (!apiKey) {
      throw new Error(
        "SMS not configured. Set HUBTEL_CLIENT_ID and HUBTEL_CLIENT_SECRET in .env or API key in settings.",
      );
    }
  }

  const from = config.senderId || process.env.HUBTEL_SENDER_ID || "OnlinePOS";
  const destination = normalizePhone(to);

  const auth =
    clientId && clientSecret
      ? Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
      : null;

  const url = new URL("https://smsc.hubtel.com/v2/messages/");
  url.searchParams.set("From", from);
  url.searchParams.set("To", destination);
  url.searchParams.set("Content", content);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: auth ? { Authorization: `Basic ${auth}` } : {},
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Hubtel SMS failed (${res.status}): ${body.slice(0, 200)}`);
  }
}

/** Africa's Talking SMS */
async function sendAfricasTalkingSms(
  config: BusinessSettings["sms"],
  to: string,
  content: string,
): Promise<void> {
  const username = process.env.AT_USERNAME;
  const apiKey = config.apiKey || process.env.AT_API_KEY;
  if (!username || !apiKey) {
    throw new Error("Africa's Talking requires AT_USERNAME and API key in settings or .env");
  }

  const body = new URLSearchParams({
    username,
    to: normalizePhone(to),
    message: content,
    from: config.senderId || process.env.AT_SENDER_ID || "",
  });

  const res = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Africa's Talking SMS failed: ${text.slice(0, 200)}`);
  }
}

export function mergeSmsConfig(
  tenant: BusinessSettings["sms"],
  platform: PlatformOfficeSmsConfig | null,
): SmsSendConfig {
  if (!platform?.enabled) return tenant;
  return {
    ...tenant,
    enabled: tenant.enabled || platform.enabled,
    provider: platform.provider || tenant.provider,
    apiKey: platform.apiKey || tenant.apiKey,
    senderId: platform.senderId || tenant.senderId,
    hubtelClientId: platform.hubtelClientId,
    hubtelClientSecret: platform.hubtelClientSecret,
  };
}

export async function sendBusinessSms(
  config: SmsSendConfig,
  to: string,
  message: string,
): Promise<void> {
  if (!config.enabled) {
    throw new Error("SMS is disabled in settings");
  }
  if (!to?.trim()) {
    throw new Error("Customer has no phone number");
  }

  const provider = config.provider || "hubtel";
  if (provider === "africas_talking") {
    await sendAfricasTalkingSms(config, to, message);
  } else {
    await sendHubtelSms(config, to, message);
  }
}
