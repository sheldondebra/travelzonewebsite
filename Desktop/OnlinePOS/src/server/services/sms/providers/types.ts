export type SendSmsPayload = {
  to: string;
  message: string;
  senderId: string;
};

export type SendSmsResponse = {
  success: boolean;
  providerMessageId?: string;
  raw?: unknown;
  error?: string;
};

export interface SmsProvider {
  readonly name: string;
  send(payload: SendSmsPayload): Promise<SendSmsResponse>;
}

export type SmsProviderConfigInput = {
  baseUrl: string;
  apiKey: string;
  username?: string | null;
  password?: string | null;
};
