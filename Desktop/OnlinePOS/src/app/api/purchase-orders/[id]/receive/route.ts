import { receivePurchaseOrder } from "@/server/services/purchase-order/create-purchase-order";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const po = await receivePurchaseOrder(businessId, id);
    return apiSuccess(po, "Stock received");
  });
}
