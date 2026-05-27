import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { verifyAndFulfillSmsPurchase } from "@/server/services/sms/sms-purchase-service";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const reference = new URL(request.url).searchParams.get("reference");
      if (!reference) throw new Error("Missing payment reference");

      const result = await verifyAndFulfillSmsPurchase(reference);
      if (result.purchase.businessId !== businessId) {
        throw new Error("Purchase does not belong to this business");
      }

      return apiSuccess({
        credited: result.credited,
        alreadyPaid: result.alreadyPaid,
        purchase: result.purchase,
      });
    } catch (e) {
      return handleApiError(e);
    }
  });
}
