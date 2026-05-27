import { z } from "zod";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { initiateSmsPurchase } from "@/server/services/sms/sms-purchase-service";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

const purchaseSchema = z.object({
  packageId: z.string().min(1),
});

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const { packageId } = purchaseSchema.parse(body);
      const result = await initiateSmsPurchase(businessId, packageId);
      return apiSuccess(result, "SMS purchase initiated", 201);
    } catch (e) {
      return handleApiError(e);
    }
  });
}
