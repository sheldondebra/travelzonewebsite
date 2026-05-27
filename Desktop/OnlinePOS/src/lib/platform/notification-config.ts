import type { BusinessSettings } from "@/lib/settings/defaults";
import { DEFAULT_SETTINGS } from "@/lib/settings/defaults";
import { maskSecret } from "@/lib/platform/secrets";

export type PlatformOfficeSmsConfig = {
  enabled: boolean;
  provider: string;
  apiKey: string;
  senderId: string;
  hubtelClientId: string;
  hubtelClientSecret: string;
};

export type PlatformOfficeMailConfig = {
  enabled: boolean;
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  resendApiKey: string;
};

export type PlatformOfficeSmsPaymentsConfig = {
  enabled: boolean;
  provider: "paystack";
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  testMode: boolean;
};

export type PlatformOfficeConfig = {
  inheritToAllTenants: boolean;
  autoEnableTenantSms: boolean;
  autoEnableTenantEmail: boolean;
  autoEnablePosReceiptDelivery: boolean;
  sms: PlatformOfficeSmsConfig;
  mail: PlatformOfficeMailConfig;
  smsPayments?: PlatformOfficeSmsPaymentsConfig;
};

export const DEFAULT_PLATFORM_OFFICE: PlatformOfficeConfig = {
  inheritToAllTenants: true,
  autoEnableTenantSms: true,
  autoEnableTenantEmail: true,
  autoEnablePosReceiptDelivery: true,
  sms: {
    enabled: false,
    provider: "hubtel",
    apiKey: "",
    senderId: "",
    hubtelClientId: "",
    hubtelClientSecret: "",
  },
  mail: {
    enabled: false,
    fromName: "Tecunit General Office",
    fromEmail: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    resendApiKey: "",
  },
  smsPayments: {
    enabled: false,
    provider: "paystack",
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    testMode: true,
  },
};

export function parsePlatformOffice(raw: unknown): PlatformOfficeConfig {
  const base = structuredClone(DEFAULT_PLATFORM_OFFICE);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Partial<PlatformOfficeConfig>;
  return {
    ...base,
    ...o,
    sms: { ...base.sms, ...(o.sms ?? {}) },
    mail: { ...base.mail, ...(o.mail ?? {}) },
    smsPayments: {
      ...base.smsPayments!,
      ...(o.smsPayments ?? {}),
    },
  };
}

export function extractPlatformOffice(settings: unknown): PlatformOfficeConfig | null {
  if (!settings || typeof settings !== "object") return null;
  const po = (settings as { platformOffice?: unknown }).platformOffice;
  return po ? parsePlatformOffice(po) : null;
}

export function maskPlatformOfficeForClient(
  config: PlatformOfficeConfig,
): PlatformOfficeConfig {
  return {
    ...config,
    sms: {
      ...config.sms,
      apiKey: maskSecret(config.sms.apiKey),
      hubtelClientId: maskSecret(config.sms.hubtelClientId),
      hubtelClientSecret: maskSecret(config.sms.hubtelClientSecret),
    },
    mail: {
      ...config.mail,
      smtpUser: maskSecret(config.mail.smtpUser),
      smtpPass: maskSecret(config.mail.smtpPass),
      resendApiKey: maskSecret(config.mail.resendApiKey),
    },
    smsPayments: config.smsPayments
      ? {
          ...config.smsPayments,
          secretKey: maskSecret(config.smsPayments.secretKey),
          webhookSecret: maskSecret(config.smsPayments.webhookSecret),
        }
      : undefined,
  };
}

/** Apply General Office credentials to a tenant's effective notification settings. */
export function applyPlatformOfficeToTenantSettings(
  tenant: BusinessSettings,
  platform: PlatformOfficeConfig,
): BusinessSettings {
  if (!platform.inheritToAllTenants) return tenant;

  const out = structuredClone(tenant);

  if (platform.autoEnableTenantSms) {
    out.sms = {
      ...out.sms,
      enabled: platform.sms.enabled || out.sms.enabled,
      provider: platform.sms.provider || out.sms.provider,
      apiKey: platform.sms.apiKey || out.sms.apiKey,
      senderId: platform.sms.senderId || out.sms.senderId,
    };
  }

  if (platform.autoEnableTenantEmail) {
    out.mail = {
      ...out.mail,
      enabled: platform.mail.enabled || out.mail.enabled,
      fromName: platform.mail.fromName || out.mail.fromName,
      fromEmail: platform.mail.fromEmail || out.mail.fromEmail,
      smtpHost: platform.mail.smtpHost || out.mail.smtpHost,
      smtpPort: platform.mail.smtpPort || out.mail.smtpPort,
    };
  }

  if (platform.autoEnablePosReceiptDelivery) {
    out.posReceipt = {
      ...out.posReceipt,
      sendSmsOnSale: platform.sms.enabled,
      sendEmailOnSale: platform.mail.enabled,
    };
  }

  return out;
}

export function platformSmsRuntimeConfig(platform: PlatformOfficeConfig) {
  return {
    enabled: platform.sms.enabled,
    provider: platform.sms.provider,
    apiKey: platform.sms.apiKey,
    senderId: platform.sms.senderId,
    hubtelClientId: platform.sms.hubtelClientId,
    hubtelClientSecret: platform.sms.hubtelClientSecret,
  };
}

export function platformMailRuntimeConfig(platform: PlatformOfficeConfig) {
  return {
    enabled: platform.mail.enabled,
    fromName: platform.mail.fromName,
    fromEmail: platform.mail.fromEmail,
    smtpHost: platform.mail.smtpHost,
    smtpPort: platform.mail.smtpPort,
    smtpUser: platform.mail.smtpUser,
    smtpPass: platform.mail.smtpPass,
    resendApiKey: platform.mail.resendApiKey,
  };
}
