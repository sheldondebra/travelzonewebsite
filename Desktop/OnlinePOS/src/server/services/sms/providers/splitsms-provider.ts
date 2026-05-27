import type {
  SendSmsPayload,
  SendSmsResponse,
  SmsProvider,
  SmsProviderConfigInput,
} from "@/server/services/sms/providers/types";

export class SplitSmsProvider implements SmsProvider {
  readonly name = "SPLITSMS";

  constructor(private config: SmsProviderConfigInput) {}

  async send(payload: SendSmsPayload): Promise<SendSmsResponse> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.config.apiKey) {
        headers.Authorization = `Bearer ${this.config.apiKey}`;
      }

      const body: Record<string, string> = {
        sender: payload.senderId,
        recipient: payload.to,
        message: payload.message,
      };

      if (this.config.username) body.username = this.config.username;
      if (this.config.password) body.password = this.config.password;

      const response = await fetch(this.config.baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg =
          (data as { message?: string })?.message ||
          (data as { error?: string })?.error ||
          "SplitSMS request failed";
        return { success: false, raw: data, error: errMsg };
      }

      const record = data as { message_id?: string; id?: string };
      return {
        success: true,
        providerMessageId: record.message_id || record.id,
        raw: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown SMS error",
      };
    }
  }
}
