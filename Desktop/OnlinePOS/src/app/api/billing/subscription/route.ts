import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const subscription = await prisma.billingSubscription.findUnique({
        where: { businessId },
        include: { plan: { include: { prices: true } } },
      });
      return apiSuccess(subscription, "Billing subscription loaded");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
