import { handleApiError, apiSuccess } from "@/server/utils/api-response";
import { parseJsonBody } from "@/server/utils/with-auth";
import { mobileLogin } from "@/server/services/auth/mobile-login";
import { mobileLoginSchema } from "@/server/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const input = mobileLoginSchema.parse(body);
    const result = await mobileLogin(input);
    return apiSuccess(result, "Signed in successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
