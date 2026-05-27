import {
  verifyPlatformUserEmail,
} from "@/server/services/platform/platform-user-service";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requirePlatformAdmin();
    const { id } = await params;
    const user = await verifyPlatformUserEmail(id, session.user!.id!);
    return apiSuccess(user, "Email verified");
  } catch (error) {
    return handleApiError(error);
  }
}
