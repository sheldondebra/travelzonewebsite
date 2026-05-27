import {
  DEFAULT_PLATFORM_OFFICE,
  extractPlatformOffice,
  maskPlatformOfficeForClient,
  parsePlatformOffice,
  type PlatformOfficeConfig,
} from "@/lib/platform/notification-config";
import { mergeSecret } from "@/lib/platform/secrets";
import { PLATFORM_OFFICE_SLUG } from "@/lib/platform/office";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";

export async function getPlatformOfficeBusiness() {
  const business = await prisma.business.findUnique({
    where: { slug: PLATFORM_OFFICE_SLUG },
    select: { id: true, name: true, slug: true, settings: true },
  });
  if (!business) {
    throw new NotFoundError(
      "General Office not found. Run npm run db:seed to create Tecunit General Office.",
    );
  }
  return business;
}

export async function getPlatformOfficeConfigRaw(): Promise<PlatformOfficeConfig> {
  const business = await getPlatformOfficeBusiness();
  const fromDb = extractPlatformOffice(business.settings);
  if (fromDb) return fromDb;

  return bootstrapFromEnv();
}

export async function getPlatformOfficeConfigMasked() {
  const raw = await getPlatformOfficeConfigRaw();
  return {
    office: await getPlatformOfficeBusiness(),
    config: maskPlatformOfficeForClient(raw),
    configured: isPlatformConfigured(raw),
  };
}

function bootstrapFromEnv(): PlatformOfficeConfig {
  const base = structuredClone(DEFAULT_PLATFORM_OFFICE);
  if (process.env.HUBTEL_CLIENT_ID) {
    base.sms.hubtelClientId = process.env.HUBTEL_CLIENT_ID;
    base.sms.enabled = true;
  }
  if (process.env.HUBTEL_CLIENT_SECRET) {
    base.sms.hubtelClientSecret = process.env.HUBTEL_CLIENT_SECRET;
  }
  if (process.env.HUBTEL_SENDER_ID) {
    base.sms.senderId = process.env.HUBTEL_SENDER_ID;
  }
  if (process.env.RESEND_API_KEY) {
    base.mail.resendApiKey = process.env.RESEND_API_KEY;
    base.mail.enabled = true;
  }
  if (process.env.RESEND_FROM_EMAIL) {
    base.mail.fromEmail = process.env.RESEND_FROM_EMAIL;
  }
  if (process.env.SMTP_HOST) {
    base.mail.smtpHost = process.env.SMTP_HOST;
    base.mail.enabled = true;
  }
  if (process.env.SMTP_USER) base.mail.smtpUser = process.env.SMTP_USER;
  if (process.env.SMTP_PASS) base.mail.smtpPass = process.env.SMTP_PASS;
  return base;
}

export function isPlatformConfigured(config: PlatformOfficeConfig): boolean {
  const smsReady =
    config.sms.enabled &&
    (Boolean(config.sms.hubtelClientId && config.sms.hubtelClientSecret) ||
      Boolean(config.sms.apiKey));
  const mailReady =
    config.mail.enabled &&
    (Boolean(config.mail.resendApiKey) ||
      Boolean(config.mail.smtpHost && config.mail.fromEmail));
  return smsReady || mailReady;
}

export async function savePlatformOfficeConfig(
  patch: Partial<PlatformOfficeConfig> & {
    sms?: Partial<PlatformOfficeConfig["sms"]>;
    mail?: Partial<PlatformOfficeConfig["mail"]>;
  },
) {
  const business = await getPlatformOfficeBusiness();
  const current = extractPlatformOffice(business.settings) ?? bootstrapFromEnv();

  const next: PlatformOfficeConfig = {
    ...current,
    ...patch,
    sms: {
      ...current.sms,
      ...(patch.sms ?? {}),
      apiKey: mergeSecret(patch.sms?.apiKey, current.sms.apiKey) ?? "",
      hubtelClientId:
        mergeSecret(patch.sms?.hubtelClientId, current.sms.hubtelClientId) ?? "",
      hubtelClientSecret:
        mergeSecret(patch.sms?.hubtelClientSecret, current.sms.hubtelClientSecret) ??
        "",
    },
    mail: {
      ...current.mail,
      ...(patch.mail ?? {}),
      smtpUser: mergeSecret(patch.mail?.smtpUser, current.mail.smtpUser) ?? "",
      smtpPass: mergeSecret(patch.mail?.smtpPass, current.mail.smtpPass) ?? "",
      resendApiKey:
        mergeSecret(patch.mail?.resendApiKey, current.mail.resendApiKey) ?? "",
    },
  };

  const existingSettings =
    business.settings && typeof business.settings === "object"
      ? (business.settings as Record<string, unknown>)
      : {};

  await prisma.business.update({
    where: { id: business.id },
    data: {
      settings: {
        ...existingSettings,
        platformOffice: next,
      },
    },
  });

  return next;
}

export async function propagatePlatformConfigToTenants(
  platform: PlatformOfficeConfig,
) {
  if (!platform.inheritToAllTenants) return { updated: 0 };

  const tenants = await prisma.business.findMany({
    where: { slug: { not: PLATFORM_OFFICE_SLUG } },
    select: { id: true, settings: true },
  });

  let updated = 0;
  for (const t of tenants) {
    const settings =
      t.settings && typeof t.settings === "object"
        ? { ...(t.settings as Record<string, unknown>) }
        : {};

    const tenantSettings = settings as Record<string, unknown>;
    const sms = (tenantSettings.sms as Record<string, unknown>) ?? {};
    const mail = (tenantSettings.mail as Record<string, unknown>) ?? {};
    const posReceipt =
      (tenantSettings.posReceipt as Record<string, unknown>) ?? {};

    const nextSettings = {
      ...tenantSettings,
      sms: platform.autoEnableTenantSms
        ? {
            ...sms,
            enabled: platform.sms.enabled,
            provider: platform.sms.provider,
          }
        : sms,
      mail: platform.autoEnableTenantEmail
        ? {
            ...mail,
            enabled: platform.mail.enabled,
            fromName: platform.mail.fromName || mail.fromName,
            fromEmail: platform.mail.fromEmail || mail.fromEmail,
          }
        : mail,
      posReceipt: platform.autoEnablePosReceiptDelivery
        ? {
            ...posReceipt,
            sendSmsOnSale: platform.sms.enabled,
            sendEmailOnSale: platform.mail.enabled,
          }
        : posReceipt,
    };

    await prisma.business.update({
      where: { id: t.id },
      data: { settings: nextSettings as Prisma.InputJsonValue },
    });
    updated++;
  }

  return { updated };
}
