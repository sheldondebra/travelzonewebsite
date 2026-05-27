import { prisma } from "@/lib/prisma";
import { calculateSmsUnits } from "@/lib/sms/calculate-units";
import type { SmsCategory } from "@/lib/sms/categories";
import { DEFAULT_SMS_TEMPLATES } from "@/lib/sms/default-templates";
import { normalizeGhanaPhone } from "@/lib/sms/normalize-phone";
import { renderSmsTemplate } from "@/lib/sms/render-template";
import type { SmsAutomationKey } from "@/lib/sms/automation-keys";
import { resolveNotificationSettings } from "@/server/services/notifications/resolve-config";
import { mergeSmsConfig } from "@/server/services/notifications/sms-provider";
import { getActiveSmsProvider } from "@/server/services/sms/providers";

export async function ensureSmsWallet(businessId: string) {
  return prisma.businessSmsWallet.upsert({
    where: { businessId },
    create: { businessId, balance: 0 },
    update: {},
  });
}

export async function getSmsWalletBalance(businessId: string) {
  const wallet = await ensureSmsWallet(businessId);
  return wallet.balance;
}

export async function creditSmsWallet(businessId: string, units: number) {
  await ensureSmsWallet(businessId);
  return prisma.businessSmsWallet.update({
    where: { businessId },
    data: { balance: { increment: units } },
  });
}

async function deductSmsWallet(businessId: string, units: number) {
  const wallet = await ensureSmsWallet(businessId);
  if (wallet.balance < units) {
    throw new Error("Insufficient SMS balance");
  }
  return prisma.businessSmsWallet.update({
    where: { businessId },
    data: { balance: { decrement: units } },
  });
}

export async function resolveBusinessSenderId(
  businessId: string,
  platformFallback?: string,
): Promise<string> {
  const approved = await prisma.businessSenderId.findFirst({
    where: { businessId, status: "APPROVED" },
    orderBy: { reviewedAt: "desc" },
  });
  if (approved?.senderId) return approved.senderId;
  if (platformFallback?.trim()) return platformFallback.trim();
  return "OnlinePOS";
}

export async function isAutomationEnabled(
  businessId: string,
  key: SmsAutomationKey,
): Promise<boolean> {
  const row = await prisma.smsAutomationSetting.findUnique({
    where: { businessId_key: { businessId, key } },
  });
  return row?.enabled ?? true;
}

export async function getSmsTemplateMessage(
  businessId: string,
  templateKey: string,
): Promise<string | null> {
  const businessTemplate = await prisma.smsTemplate.findFirst({
    where: { businessId, key: templateKey, isActive: true },
  });
  if (businessTemplate) return businessTemplate.message;

  const globalTemplate = await prisma.smsTemplate.findFirst({
    where: { businessId: null, key: templateKey, isActive: true },
  });
  if (globalTemplate) return globalTemplate.message;

  const fallback = DEFAULT_SMS_TEMPLATES.find((t) => t.key === templateKey);
  return fallback?.message ?? null;
}

export type SendTransactionalSmsInput = {
  businessId: string;
  recipient: string;
  message?: string;
  templateKey?: string;
  variables?: Record<string, string | number | null | undefined>;
  category: SmsCategory;
  relatedType?: string;
  relatedId?: string;
  automationKey?: SmsAutomationKey;
  skipAutomationCheck?: boolean;
  skipWalletCheck?: boolean;
  allowMarketingWithoutSender?: boolean;
};

export type SendTransactionalSmsResult = {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  logId?: string;
  smsUnits?: number;
};

export async function sendTransactionalSms(
  input: SendTransactionalSmsInput,
): Promise<SendTransactionalSmsResult> {
  const phone = input.recipient?.trim();
  if (!phone) {
    return { sent: false, skipped: true, reason: "No phone number" };
  }

  if (
    input.automationKey &&
    !input.skipAutomationCheck &&
    !(await isAutomationEnabled(input.businessId, input.automationKey))
  ) {
    return { sent: false, skipped: true, reason: "Automation disabled" };
  }

  let message = input.message?.trim() ?? "";
  if (!message && input.templateKey) {
    const template = await getSmsTemplateMessage(
      input.businessId,
      input.templateKey,
    );
    if (!template) {
      return { sent: false, skipped: true, reason: "Template not found" };
    }
    message = renderSmsTemplate(template, input.variables ?? {});
  }

  if (!message) {
    return { sent: false, skipped: true, reason: "Empty message" };
  }

  const normalizedTo = normalizeGhanaPhone(phone);
  const smsUnits = calculateSmsUnits(message);

  if (!input.skipWalletCheck) {
    const balance = await getSmsWalletBalance(input.businessId);
    if (balance < smsUnits) {
      const log = await prisma.smsLog.create({
        data: {
          businessId: input.businessId,
          recipient: normalizedTo,
          message,
          category: input.category,
          status: "FAILED",
          errorMessage: "Insufficient SMS balance",
          smsUnits,
          relatedType: input.relatedType,
          relatedId: input.relatedId,
        },
      });
      return {
        sent: false,
        reason: "Insufficient SMS balance",
        logId: log.id,
        smsUnits,
      };
    }
  }

  const resolved = await resolveNotificationSettings(input.businessId);
  const smsConfig = mergeSmsConfig(
    resolved.settings.sms,
    resolved.platformSms,
  );

  let providerName = "SPLITSMS";
  let senderId = "OnlinePOS";

  try {
    const active = await getActiveSmsProvider(smsConfig);
    providerName = active.providerName;
    senderId = await resolveBusinessSenderId(
      input.businessId,
      active.fallbackSenderId || smsConfig.senderId,
    );

    if (
      input.category === "MARKETING" &&
      !input.allowMarketingWithoutSender
    ) {
      const hasApproved = await prisma.businessSenderId.findFirst({
        where: { businessId: input.businessId, status: "APPROVED" },
      });
      if (!hasApproved) {
        const log = await prisma.smsLog.create({
          data: {
            businessId: input.businessId,
            recipient: normalizedTo,
            senderId,
            message,
            category: input.category,
            status: "FAILED",
            provider: providerName,
            errorMessage: "Marketing SMS requires approved Sender ID",
            smsUnits,
            relatedType: input.relatedType,
            relatedId: input.relatedId,
          },
        });
        return {
          sent: false,
          reason: "Approved Sender ID required for marketing SMS",
          logId: log.id,
        };
      }
    }

    const pendingLog = await prisma.smsLog.create({
      data: {
        businessId: input.businessId,
        recipient: normalizedTo,
        senderId,
        message,
        category: input.category,
        status: "PENDING",
        provider: providerName,
        smsUnits,
        relatedType: input.relatedType,
        relatedId: input.relatedId,
      },
    });

    const response = await active.provider.send({
      to: normalizedTo,
      message,
      senderId,
    });

    if (response.success) {
      if (!input.skipWalletCheck) {
        await deductSmsWallet(input.businessId, smsUnits);
      }
      await prisma.smsLog.update({
        where: { id: pendingLog.id },
        data: {
          status: "SENT",
          providerMessageId: response.providerMessageId,
          providerResponse: response.raw as object | undefined,
          sentAt: new Date(),
        },
      });
      return { sent: true, logId: pendingLog.id, smsUnits };
    }

    await prisma.smsLog.update({
      where: { id: pendingLog.id },
      data: {
        status: "FAILED",
        errorMessage: response.error ?? "Provider rejected SMS",
        providerResponse: response.raw as object | undefined,
      },
    });
    return {
      sent: false,
      reason: response.error ?? "SMS failed",
      logId: pendingLog.id,
      smsUnits,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "SMS error";
    const log = await prisma.smsLog.create({
      data: {
        businessId: input.businessId,
        recipient: normalizedTo,
        senderId,
        message,
        category: input.category,
        status: "FAILED",
        provider: providerName,
        errorMessage: errMsg,
        smsUnits,
        relatedType: input.relatedType,
        relatedId: input.relatedId,
      },
    });
    return { sent: false, reason: errMsg, logId: log.id, smsUnits };
  }
}

export async function seedDefaultSmsPackages(options?: { force?: boolean }) {
  const { DEFAULT_SMS_PACKAGES } = await import("@/lib/sms/default-templates");

  if (options?.force) {
    await prisma.smsPackage.deleteMany({});
  } else {
    const count = await prisma.smsPackage.count();
    if (count > 0) {
      let created = 0;
      for (const pkg of DEFAULT_SMS_PACKAGES) {
        const exists = await prisma.smsPackage.findFirst({
          where: { name: pkg.name },
        });
        if (!exists) {
          await prisma.smsPackage.create({ data: pkg });
          created++;
        }
      }
      return { seeded: created > 0, count: count + created, added: created };
    }
  }

  await prisma.smsPackage.createMany({ data: DEFAULT_SMS_PACKAGES });
  return { seeded: true, count: DEFAULT_SMS_PACKAGES.length, added: DEFAULT_SMS_PACKAGES.length };
}

export async function seedDefaultSmsTemplates() {
  for (const tpl of DEFAULT_SMS_TEMPLATES) {
    const exists = await prisma.smsTemplate.findFirst({
      where: { businessId: null, key: tpl.key },
    });
    if (!exists) {
      await prisma.smsTemplate.create({
        data: {
          businessId: null,
          key: tpl.key,
          title: tpl.title,
          message: tpl.message,
        },
      });
    }
  }
}
