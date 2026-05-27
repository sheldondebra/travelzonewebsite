import { getServerSession } from "next-auth";
import {
  deletePlatformUser,
  getPlatformUser,
  updatePlatformUser,
} from "@/server/services/platform/platform-user-service";
import { updatePlatformUserSchema } from "@/server/validations/platform-user";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const user = await getPlatformUser(id);
    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requirePlatformAdmin();
    const { id } = await params;
    const body = await parseJsonBody(request);
    const input = updatePlatformUserSchema.parse(body);
    const user = await updatePlatformUser(id, input, session.user!.id!);
    return apiSuccess(user, "User updated");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requirePlatformAdmin();
    const { id } = await params;
    await deletePlatformUser(id, session.user!.id!);
    return apiSuccess({ deleted: true }, "User deleted");
  } catch (error) {
    return handleApiError(error);
  }
}
