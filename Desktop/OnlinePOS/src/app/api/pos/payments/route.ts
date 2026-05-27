import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";
import { NotFoundError } from "@/server/utils/errors";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) throw new NotFoundError("Order id required");

    const payments = await prisma.orderPayment.findMany({
      where: { order: { id: orderId, businessId } },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(payments, "Payments fetched");
  });
}
