import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const rows = await prisma.businessSenderId.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { business: { select: { name: true, slug: true } } },
    });
    return apiSuccess(rows);
  } catch (e) {
    return handleApiError(e);
  }
}

const reviewSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "DENIED"]),
  reason: z.string().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await requirePlatformAdmin();
    const body = await parseJsonBody(request);
    const { id, status, reason } = reviewSchema.parse(body);

    const row = await prisma.businessSenderId.update({
      where: { id },
      data: {
        status,
        reason: reason ?? null,
        reviewedBy: session.user?.id,
        reviewedAt: new Date(),
      },
    });

    return apiSuccess(row, `Sender ID ${status.toLowerCase()}`);
  } catch (e) {
    return handleApiError(e);
  }
}
