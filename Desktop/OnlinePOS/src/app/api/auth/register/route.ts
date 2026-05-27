import { registerUser } from "@/server/services/auth/register-user";
import { registerSchema } from "@/server/validations/auth";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const input = registerSchema.parse(body);
    const user = await registerUser(input);
    return apiSuccess(user, "Account created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
