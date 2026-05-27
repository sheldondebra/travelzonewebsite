import { setPlatformUserSuspended } from "@/server/services/platform/platform-user-service";
import { suspendPlatformUserSchema } from "@/server/validations/platform-user";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requirePlatformAdmin();
    const { id } = await params;
    const body = await parseJsonBody(request);
    const { suspended, reason } = suspendPlatformUserSchema.parse(body);
    const user = await setPlatformUserSuspended(
      id,
      suspended,
      reason,
      session.user!.id!,
    );
    return apiSuccess(user, suspended ? "User suspended" : "User reactivated");
  } catch (error) {
    return handleApiError(error);
  }
}
