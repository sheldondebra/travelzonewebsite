import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async () => {
    const packages = await prisma.smsPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(packages);
  });
}
