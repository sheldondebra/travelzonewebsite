import { closeRegisterSession } from "@/server/services/pos/register";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessUserAuth, parseJsonBody } from "@/server/utils/with-auth";
import { closeRegisterSchema } from "@/server/validations/pos";

export async function POST(request: Request) {
  return withBusinessUserAuth(request, async ({ businessId, userId }) => {
    const body = await parseJsonBody(request);
    const input = closeRegisterSchema.parse(body);
    const session = await closeRegisterSession(
      businessId,
      userId,
      input.sessionId,
      input.countedCash,
      input.closingNote,
    );
    return apiSuccess({ session }, "Register closed");
  });
}
