import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const payments = await prisma.billingPayment.findMany({
        where: { businessId },
        include: { plan: true, coupon: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return apiSuccess(payments, "Billing payments loaded");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
