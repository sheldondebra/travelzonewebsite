import type { BusinessSettings } from "@/lib/settings/defaults";
import { normalizeGhanaPhone } from "@/lib/sms/normalize-phone";
import type {
  SendSmsPayload,
  SendSmsResponse,
  SmsProvider,
} from "@/server/services/sms/providers/types";

/** Wraps existing Hubtel integration as SmsProvider */
export class HubtelSmsProvider implements SmsProvider {
  readonly name = "HUBTEL";

  constructor(private config: BusinessSettings["sms"]) {}

  async send(payload: SendSmsPayload): Promise<SendSmsResponse> {
    try {
      const clientId =
        process.env.HUBTEL_CLIENT_ID || process.env.HUBTEL_SMS_CLIENT_ID;
      const clientSecret =
        process.env.HUBTEL_CLIENT_SECRET || process.env.HUBTEL_SMS_CLIENT_SECRET;
      const apiKey = this.config.apiKey || process.env.HUBTEL_SMS_API_KEY;

      if (!clientId || !clientSecret) {
        if (!apiKey) {
          return {
            success: false,
            error:
              "SMS not configured. Set HUBTEL credentials or SplitSMS provider in General Office.",
          };
        }
      }

      const destination = normalizeGhanaPhone(payload.to);
      const from =
        payload.senderId ||
        this.config.senderId ||
        process.env.HUBTEL_SENDER_ID ||
        "OnlinePOS";

      const auth =
        clientId && clientSecret
          ? Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
          : null;

      const url = new URL("https://smsc.hubtel.com/v2/messages/");
      url.searchParams.set("From", from);
      url.searchParams.set("To", destination);
      url.searchParams.set("Content", payload.message);

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: auth ? { Authorization: `Basic ${auth}` } : {},
      });

      const text = await res.text();
      if (!res.ok) {
        return {
          success: false,
          raw: text,
          error: `Hubtel SMS failed (${res.status}): ${text.slice(0, 200)}`,
        };
      }

      return { success: true, raw: text };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Hubtel SMS error",
      };
    }
  }
}
