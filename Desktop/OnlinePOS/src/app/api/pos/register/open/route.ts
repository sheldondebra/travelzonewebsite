import {
  getOpenRegisterSession,
  openRegisterSession,
} from "@/server/services/pos/register";
import { resolvePosCashierId } from "@/server/services/pos/cashier";
import { apiSuccess } from "@/server/utils/api-response";
import {
  withBusinessAuth,
  withBusinessUserAuth,
  parseJsonBody,
} from "@/server/utils/with-auth";
import { openRegisterSchema } from "@/server/validations/pos";
import { z } from "zod";

const openRegisterBodySchema = openRegisterSchema.extend({
  cashierToken: z.string().optional(),
});

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const session = await getOpenRegisterSession(businessId);
    return apiSuccess({ session }, "Register status fetched");
  });
}

export async function POST(request: Request) {
  return withBusinessUserAuth(request, async ({ businessId, userId }) => {
    const body = await parseJsonBody(request);
    const input = openRegisterBodySchema.parse(body);
    const cashierId = await resolvePosCashierId(
      request,
      businessId,
      userId,
      input.cashierToken,
    );
    const session = await openRegisterSession(
      businessId,
      cashierId,
      input.openingFloat,
      input.openingNote,
    );
    return apiSuccess({ session }, "Register opened", 201);
  });
}
