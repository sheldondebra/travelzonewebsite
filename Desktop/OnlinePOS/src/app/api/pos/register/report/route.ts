import { buildRegisterReport } from "@/server/services/pos/register-report";
import { recordCashMovement } from "@/server/services/pos/register";
import { apiSuccess } from "@/server/utils/api-response";
import {
  withBusinessAuth,
  withBusinessUserAuth,
  parseJsonBody,
} from "@/server/utils/with-auth";
import {
  cashMovementSchema,
  registerReportSchema,
} from "@/server/validations/pos";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const parsed = registerReportSchema.parse({
      sessionId: searchParams.get("sessionId"),
      type: searchParams.get("type") ?? "X",
    });
    const report = await buildRegisterReport(
      businessId,
      parsed.sessionId,
      parsed.type,
    );
    return apiSuccess(report, "Register report generated");
  });
}

export async function POST(request: Request) {
  return withBusinessUserAuth(request, async ({ businessId, userId }) => {
    const body = await parseJsonBody(request);
    const input = cashMovementSchema.parse(body);
    const movement = await recordCashMovement(
      businessId,
      userId,
      input.sessionId,
      input.type,
      input.amount,
      input.reason,
    );
    return apiSuccess({ movement }, "Cash movement recorded", 201);
  });
}
