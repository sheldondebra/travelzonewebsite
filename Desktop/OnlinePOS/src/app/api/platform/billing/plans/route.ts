import { z } from "zod";
import { BillingInterval, SubscriptionPlan } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";
import {
  listBillingPlans,
  seedDefaultBillingData,
} from "@/server/services/billing/billing-service";

const priceSchema = z.object({
  interval: z.enum(BillingInterval),
  currency: z.string().min(3).max(3),
  amount: z.number().min(0),
});

const planSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  plan: z.enum(SubscriptionPlan),
  features: z.array(z.string()).default([]),
  comparison: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  prices: z.array(priceSchema).default([]),
});

export async function GET() {
  try {
    await requirePlatformAdmin();
    const plans = await listBillingPlans(true);
    return apiSuccess(plans, "Billing plans loaded");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();
    const input = planSchema.parse(await parseJsonBody(request));
    const plan = await prisma.billingPlan.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        plan: input.plan,
        features: input.features,
        comparison: input.comparison,
        isPopular: input.isPopular,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        prices: { create: input.prices },
      },
      include: { prices: true },
    });
    return apiSuccess(plan, "Billing plan created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requirePlatformAdmin();
    const input = planSchema.partial().extend({ id: z.string() }).parse(await parseJsonBody(request));
    const { id, prices, ...planPatch } = input;
    const plan = await prisma.$transaction(async (tx) => {
      await tx.billingPlan.update({ where: { id }, data: planPatch });
      if (prices) {
        for (const price of prices) {
          await tx.billingPlanPrice.upsert({
            where: {
              planId_interval_currency: {
                planId: id,
                interval: price.interval,
                currency: price.currency.toUpperCase(),
              },
            },
            create: { ...price, planId: id, currency: price.currency.toUpperCase() },
            update: { amount: price.amount },
          });
        }
      }
      return tx.billingPlan.findUnique({ where: { id }, include: { prices: true } });
    });
    return apiSuccess(plan, "Billing plan saved");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT() {
  try {
    await requirePlatformAdmin();
    await seedDefaultBillingData();
    return apiSuccess(null, "Default billing plans seeded");
  } catch (error) {
    return handleApiError(error);
  }
}
