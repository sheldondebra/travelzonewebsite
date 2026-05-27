import { sendCustomerSms } from "@/server/services/customer/send-customer-sms";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { sendCustomerSmsSchema } from "@/server/validations/customer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const { message } = sendCustomerSmsSchema.parse(body);
    const result = await sendCustomerSms(businessId, id, message);
    return apiSuccess(result, "SMS sent");
  });
}
