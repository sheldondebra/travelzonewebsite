import { z } from "zod";
import { BillingSubscriptionStatus, SubscriptionPlan } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(BillingSubscriptionStatus).optional(),
  plan: z.enum(SubscriptionPlan).optional(),
  cancelAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  try {
    await requirePlatformAdmin();
    const subscriptions = await prisma.billingSubscription.findMany({
      include: {
        business: { select: { id: true, name: true, slug: true } },
        plan: true,
        payments: { orderBy: { createdAt: "desc" }, take: 3 },
      },
      orderBy: { updatedAt: "desc" },
    });
    return apiSuccess(subscriptions, "Subscriptions loaded");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requirePlatformAdmin();
    const input = patchSchema.parse(await parseJsonBody(request));
    const subscription = await prisma.billingSubscription.update({
      where: { id: input.id },
      data: {
        status: input.status,
        cancelAt: input.cancelAt ? new Date(input.cancelAt) : input.cancelAt,
        business: input.plan
          ? { update: { subscriptionPlan: input.plan } }
          : undefined,
      },
      include: { business: true, plan: true },
    });
    return apiSuccess(subscription, "Subscription saved");
  } catch (error) {
    return handleApiError(error);
  }
}
