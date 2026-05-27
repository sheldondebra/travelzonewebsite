import { resetPasswordWithToken } from "@/server/services/auth/password-reset";
import { resetPasswordSchema } from "@/server/validations/auth";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const { token, password } = resetPasswordSchema.parse(body);
    const result = await resetPasswordWithToken(token, password);
    return apiSuccess(result, result.message);
  } catch (error) {
    return handleApiError(error);
  }
}
