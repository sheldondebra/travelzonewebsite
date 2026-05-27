import { prisma } from "@/lib/prisma";
import { paginatedResult } from "@/lib/pagination";
import { parsePaginationQuery } from "@/server/validations/pagination";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePaginationQuery(searchParams);

    const where = { businessId };
    const [total, logs] = await Promise.all([
      prisma.smsLog.count({ where }),
      prisma.smsLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return apiSuccess(paginatedResult(logs, total, page, pageSize));
  });
}
