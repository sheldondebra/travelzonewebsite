import { requestPasswordReset } from "@/server/services/auth/password-reset";
import { forgotPasswordSchema } from "@/server/validations/auth";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const { email } = forgotPasswordSchema.parse(body);
    const result = await requestPasswordReset(email);
    return apiSuccess(result, result.message);
  } catch (error) {
    return handleApiError(error);
  }
}
