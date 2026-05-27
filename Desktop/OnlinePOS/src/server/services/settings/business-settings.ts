import { prisma } from "@/lib/prisma";
import {
  applySettingsPatch,
  mergeSettings,
  type BusinessSettings,
} from "@/lib/settings/defaults";
import type { Prisma } from "@/generated/prisma/client";

export async function getBusinessSettings(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      themeColor: true,
      currency: true,
      taxRate: true,
      receiptFooter: true,
      subscriptionPlan: true,
      settings: true,
    },
  });
  if (!business) return null;

  const settings = mergeSettings(business.settings, {
    themeColor: business.themeColor,
    currency: business.currency,
    receiptFooter: business.receiptFooter,
  });

  return { business, settings };
}

export async function updateBusinessSettings(
  businessId: string,
  input: {
    settings?: Partial<BusinessSettings>;
    themeColor?: string;
    currency?: string;
    receiptFooter?: string;
    taxRate?: number;
    recordBackup?: boolean;
  },
) {
  const current = await getBusinessSettings(businessId);
  if (!current) throw new Error("Business not found");

  const merged = input.settings
    ? applySettingsPatch(current.settings, input.settings)
    : current.settings;

  const data: Prisma.BusinessUpdateInput = {
    settings: merged as Prisma.InputJsonValue,
  };

  if (input.themeColor !== undefined) {
    data.themeColor = input.themeColor;
    merged.appearance.primaryColor = input.themeColor;
  }
  if (input.currency !== undefined) {
    data.currency = input.currency;
    merged.currency.code = input.currency;
  }
  if (input.receiptFooter !== undefined) {
    data.receiptFooter = input.receiptFooter;
    merged.posReceipt.thankYouMessage = input.receiptFooter;
  }
  if (input.taxRate !== undefined) data.taxRate = input.taxRate;

  if (input.recordBackup) {
    merged.backup.lastBackupAt = new Date().toISOString();
  }

  if (merged.warehouse.enabled) {
    const existing = await prisma.warehouse.findFirst({
      where: { businessId, deletedAt: null },
    });
    if (!existing) {
      await prisma.warehouse.create({
        data: {
          businessId,
          name: merged.warehouse.defaultName || "Main warehouse",
          isDefault: true,
          isActive: true,
        },
      });
    }
  }

  data.settings = merged as Prisma.InputJsonValue;

  const business = await prisma.business.update({
    where: { id: businessId },
    data,
  });

  return { business, settings: merged };
}

export function exportSettingsBackup(settings: BusinessSettings) {
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    settings,
  };
}
