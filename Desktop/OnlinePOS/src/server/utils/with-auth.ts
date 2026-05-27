import { getBusinessIdFromRequest, getUserIdFromRequest } from "@/lib/session";
import { apiError, handleApiError } from "@/server/utils/api-response";
import { UnauthorizedError } from "@/server/utils/errors";

export async function withBusinessAuth(
  request: Request,
  handler: (businessId: string) => Promise<Response>,
): Promise<Response> {
  try {
    const businessId = await getBusinessIdFromRequest(request);
    if (!businessId) {
      throw new UnauthorizedError();
    }
    return await handler(businessId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function withBusinessUserAuth(
  request: Request,
  handler: (ctx: { businessId: string; userId: string }) => Promise<Response>,
): Promise<Response> {
  try {
    const businessId = await getBusinessIdFromRequest(request);
    const userId = await getUserIdFromRequest(request);
    if (!businessId || !userId) {
      throw new UnauthorizedError();
    }
    return await handler({ businessId, userId });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}
