import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { verifyMobileToken } from "@/lib/jwt";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { UnauthorizedError } from "@/server/utils/errors";

async function getUserId(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const payload = await verifyMobileToken(auth.slice(7));
    return payload.userId;
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        businessId: true,
        business: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    return apiSuccess(user, "Settings fetched successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
