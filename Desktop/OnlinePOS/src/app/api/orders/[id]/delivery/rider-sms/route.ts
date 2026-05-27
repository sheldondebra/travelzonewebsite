import { sendRiderDeliverySms } from "@/server/services/order/send-rider-delivery-sms";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { z } from "zod";

const bodySchema = z.object({
  riderPhone: z.string().min(6).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const input = bodySchema.parse(body);
      const result = await sendRiderDeliverySms(businessId, id, {
        riderPhone: input.riderPhone,
      });
      return apiSuccess(result, "Delivery details sent to rider");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
