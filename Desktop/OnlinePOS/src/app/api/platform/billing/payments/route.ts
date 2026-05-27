import { BillingPaymentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";

export async function GET(request: Request) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as BillingPaymentStatus | null;
    const payments = await prisma.billingPayment.findMany({
      where: status ? { status } : undefined,
      include: {
        business: { select: { name: true, slug: true } },
        plan: true,
        coupon: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return apiSuccess(payments, "Billing payments loaded");
  } catch (error) {
    return handleApiError(error);
  }
}
