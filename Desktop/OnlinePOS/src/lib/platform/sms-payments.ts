import {
  extractPlatformOffice,
  parsePlatformOffice,
  type PlatformOfficeConfig,
} from "@/lib/platform/notification-config";
import { mergeSecret } from "@/lib/platform/secrets";
import { PLATFORM_OFFICE_SLUG } from "@/lib/platform/office";
import { prisma } from "@/lib/prisma";

export type SmsPaymentConfig = {
  enabled: boolean;
  provider: "paystack";
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  testMode: boolean;
};

export const DEFAULT_SMS_PAYMENTS: SmsPaymentConfig = {
  enabled: false,
  provider: "paystack",
  publicKey: "",
  secretKey: "",
  webhookSecret: "",
  testMode: true,
};

export function smsPaymentsFromPlatformOffice(
  config: PlatformOfficeConfig,
): SmsPaymentConfig {
  return {
    ...DEFAULT_SMS_PAYMENTS,
    ...(config.smsPayments ?? {}),
  };
}

function bootstrapSmsPaymentsFromEnv(): SmsPaymentConfig {
  const secretKey =
    process.env.PAYSTACK_SECRET_KEY ??
    process.env.PLATFORM_PAYSTACK_SECRET_KEY ??
    "";
  const publicKey =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ??
    process.env.PAYSTACK_PUBLIC_KEY ??
    "";
  const webhookSecret =
    process.env.PAYSTACK_WEBHOOK_SECRET ??
    process.env.PLATFORM_PAYSTACK_WEBHOOK_SECRET ??
    "";

  return {
    enabled: Boolean(secretKey && publicKey),
    provider: "paystack",
    publicKey,
    secretKey,
    webhookSecret,
    testMode: process.env.PAYSTACK_TEST_MODE !== "false",
  };
}

export async function getSmsPaymentConfig(): Promise<SmsPaymentConfig> {
  const office = await prisma.business.findUnique({
    where: { slug: PLATFORM_OFFICE_SLUG },
    select: { settings: true },
  });

  const fromDb = extractPlatformOffice(office?.settings);
  if (fromDb?.smsPayments?.secretKey || fromDb?.smsPayments?.publicKey) {
    const merged = smsPaymentsFromPlatformOffice(fromDb);
    const env = bootstrapSmsPaymentsFromEnv();
    return {
      ...merged,
      publicKey: merged.publicKey || env.publicKey,
      secretKey: merged.secretKey || env.secretKey,
      webhookSecret: merged.webhookSecret || env.webhookSecret,
      enabled: merged.enabled && Boolean(merged.secretKey && merged.publicKey),
    };
  }

  return bootstrapSmsPaymentsFromEnv();
}

export function isSmsPurchaseDevMode(): boolean {
  return (
    process.env.SMS_PURCHASE_DEV_MODE === "true" ||
    (process.env.NODE_ENV === "development" &&
      process.env.SMS_PURCHASE_DEV_MODE !== "false")
  );
}

export async function saveSmsPaymentConfig(
  patch: Partial<SmsPaymentConfig>,
): Promise<SmsPaymentConfig> {
  const office = await prisma.business.findUnique({
    where: { slug: PLATFORM_OFFICE_SLUG },
    select: { id: true, settings: true },
  });
  if (!office) throw new Error("General Office not found");

  const current = extractPlatformOffice(office.settings) ?? parsePlatformOffice({});
  const prev = smsPaymentsFromPlatformOffice(current);

  const nextPayments: SmsPaymentConfig = {
    ...prev,
    ...patch,
    secretKey: mergeSecret(patch.secretKey, prev.secretKey) ?? "",
    webhookSecret: mergeSecret(patch.webhookSecret, prev.webhookSecret) ?? "",
  };

  const existingSettings =
    office.settings && typeof office.settings === "object"
      ? (office.settings as Record<string, unknown>)
      : {};

  await prisma.business.update({
    where: { id: office.id },
    data: {
      settings: {
        ...existingSettings,
        platformOffice: {
          ...current,
          smsPayments: nextPayments,
        },
      },
    },
  });

  return {
    ...nextPayments,
    enabled:
      nextPayments.enabled &&
      Boolean(nextPayments.secretKey && nextPayments.publicKey),
  };
}
