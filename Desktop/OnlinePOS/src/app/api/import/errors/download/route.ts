import { prisma } from "@/lib/prisma";
import { withBusinessAuth } from "@/server/utils/with-auth";
import { NotFoundError } from "@/server/utils/errors";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return new Response("sessionId required", { status: 400 });
    }

    const logs = await prisma.migrationLog.findMany({
      where: {
        businessId,
        importSessionId: sessionId,
        status: "FAILED",
      },
      orderBy: { createdAt: "asc" },
    });

    if (logs.length === 0) {
      const session = await prisma.importSession.findFirst({
        where: { id: sessionId, businessId },
      });
      if (!session) throw new NotFoundError("Session not found");
    }

    const header = "table_name,old_id,message,created_at\n";
    const rows = logs
      .map(
        (l) =>
          `"${l.tableName}",${l.oldId ?? ""},"${(l.message ?? "").replace(/"/g, '""')}",${l.createdAt.toISOString()}`,
      )
      .join("\n");

    return new Response(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="import-errors-${sessionId}.csv"`,
      },
    });
  });
}
