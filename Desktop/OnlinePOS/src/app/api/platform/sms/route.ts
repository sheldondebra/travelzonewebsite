import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  creditSmsWallet,
  seedDefaultSmsPackages,
  seedDefaultSmsTemplates,
} from "@/server/services/sms/sms-service";
import { getPlatformSmsAnalytics } from "@/server/services/sms/platform-sms-analytics";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";

export async function GET() {
  try {
    await requirePlatformAdmin();

    const [
      totalSent,
      totalFailed,
      pendingSenderIds,
      packages,
      wallets,
      provider,
      analytics,
      totalPending,
      totalPurchases,
    ] = await Promise.all([
      prisma.smsLog.count({ where: { status: "SENT" } }),
      prisma.smsLog.count({ where: { status: "FAILED" } }),
      prisma.businessSenderId.count({ where: { status: "PENDING" } }),
      prisma.smsPackage.count({ where: { isActive: true } }),
      prisma.businessSmsWallet.aggregate({ _sum: { balance: true } }),
      prisma.smsProviderConfig.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          provider: true,
          baseUrl: true,
          senderId: true,
          isActive: true,
          updatedAt: true,
        },
      }),
      getPlatformSmsAnalytics(),
      prisma.smsLog.count({ where: { status: "PENDING" } }),
      prisma.smsPurchase.count({ where: { paymentStatus: "PAID" } }),
    ]);

    const revenue = await prisma.smsPurchase.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { amount: true },
    });

    return apiSuccess({
      stats: {
        totalSent,
        totalFailed,
        pendingSenderIds,
        activePackages: packages,
        totalWalletBalance: wallets._sum.balance ?? 0,
        totalRevenue: revenue._sum.amount ?? 0,
        totalPending,
        totalPurchases,
      },
      provider,
      analytics,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = await parseJsonBody<{ action?: string }>(request);
    if (body.action === "seed") {
      const [packages,] = await Promise.all([
        seedDefaultSmsPackages(),
        seedDefaultSmsTemplates(),
      ]);
      return apiSuccess({ packages }, "SMS defaults seeded");
    }
    return apiSuccess(null, "No action");
  } catch (e) {
    return handleApiError(e);
  }
}

const providerSchema = z.object({
  provider: z.string().default("SPLITSMS"),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  username: z.string().optional(),
  password: z.string().optional(),
  senderId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function PATCH(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = await parseJsonBody(request);
    const input = providerSchema.parse(body);

    const existing = await prisma.smsProviderConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    const config = existing
      ? await prisma.smsProviderConfig.update({
          where: { id: existing.id },
          data: input,
        })
      : await prisma.smsProviderConfig.create({ data: input });

    return apiSuccess(config, "SMS provider saved");
  } catch (e) {
    return handleApiError(e);
  }
}

const walletAdjustSchema = z.object({
  businessId: z.string(),
  amount: z.number().int(),
});

export async function PUT(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = await parseJsonBody(request);
    const { businessId, amount } = walletAdjustSchema.parse(body);

    if (amount >= 0) {
      await creditSmsWallet(businessId, amount);
    } else {
      await prisma.businessSmsWallet.upsert({
        where: { businessId },
        create: { businessId, balance: 0 },
        update: { balance: { increment: amount } },
      });
    }

    const wallet = await prisma.businessSmsWallet.findUnique({
      where: { businessId },
    });
    return apiSuccess(wallet, "Wallet updated");
  } catch (e) {
    return handleApiError(e);
  }
}
