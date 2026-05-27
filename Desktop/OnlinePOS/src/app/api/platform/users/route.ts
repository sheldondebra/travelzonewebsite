import {
  createPlatformUser,
  getPlatformUserStats,
  listPlatformUsers,
} from "@/server/services/platform/platform-user-service";
import {
  createPlatformUserSchema,
  listPlatformUsersSchema,
} from "@/server/validations/platform-user";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("stats") === "1") {
      const stats = await getPlatformUserStats();
      return apiSuccess(stats);
    }

    const input = listPlatformUsersSchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 25,
      search: searchParams.get("search") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      businessId: searchParams.get("businessId") ?? undefined,
      suspended: searchParams.get("suspended") ?? "all",
      emailVerified: searchParams.get("emailVerified") ?? "all",
    });

    const result = await listPlatformUsers(input);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePlatformAdmin();
    const body = await parseJsonBody(request);
    const input = createPlatformUserSchema.parse(body);
    const user = await createPlatformUser(input, session.user!.id!);
    return apiSuccess(user, "User created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
