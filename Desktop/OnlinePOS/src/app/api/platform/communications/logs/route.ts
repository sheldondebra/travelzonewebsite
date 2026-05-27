import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { UnauthorizedError } from "@/server/utils/errors";

async function requirePlatformAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "PLATFORM_ADMIN") return session;
  throw new UnauthorizedError("Platform admin access required");
}

export async function GET(request: Request) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const logs = await prisma.notificationLog.findMany({
      where: {
        ...(channel ? { channel } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        business: { select: { id: true, name: true, slug: true } },
      },
    });

    const stats = await prisma.notificationLog.groupBy({
      by: ["status"],
      _count: true,
    });

    return apiSuccess({ logs, stats }, "Notification logs");
  } catch (error) {
    return handleApiError(error);
  }
}
