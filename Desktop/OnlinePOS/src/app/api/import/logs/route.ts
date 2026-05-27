import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const status = searchParams.get("status");

    const logs = await prisma.migrationLog.findMany({
      where: {
        businessId,
        ...(sessionId ? { importSessionId: sessionId } : {}),
        ...(status ? { status: status as "SUCCESS" | "FAILED" | "SKIPPED" | "WARNING" } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const session = sessionId
      ? await prisma.importSession.findFirst({
          where: { id: sessionId, businessId },
        })
      : null;

    return apiSuccess({ session, logs }, "Import logs loaded");
  });
}
