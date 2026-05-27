import { getPlatformUserActivity } from "@/server/services/platform/platform-user-service";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
    const logs = await getPlatformUserActivity(id, limit);
    return apiSuccess(logs);
  } catch (error) {
    return handleApiError(error);
  }
}
