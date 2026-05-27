import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { changePassword } from "@/server/services/auth/password-reset";
import { changePasswordSchema } from "@/server/validations/auth";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody } from "@/server/utils/with-auth";
import { UnauthorizedError } from "@/server/utils/errors";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const body = await parseJsonBody(request);
    const input = changePasswordSchema.parse(body);
    const result = await changePassword(
      session.user.id,
      input.currentPassword,
      input.newPassword,
    );
    return apiSuccess(result, result.message);
  } catch (error) {
    return handleApiError(error);
  }
}
