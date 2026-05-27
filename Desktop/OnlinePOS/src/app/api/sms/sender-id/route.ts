import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, withBusinessUserAuth, parseJsonBody } from "@/server/utils/with-auth";

const requestSchema = z.object({
  senderId: z
    .string()
    .min(3)
    .max(11)
    .regex(/^[A-Za-z0-9]+$/, "Sender ID must be alphanumeric"),
});

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const rows = await prisma.businessSenderId.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return apiSuccess(rows);
  });
}

export async function POST(request: Request) {
  return withBusinessUserAuth(request, async ({ businessId, userId }) => {
    const body = await parseJsonBody(request);
    const { senderId } = requestSchema.parse(body);

    const pending = await prisma.businessSenderId.findFirst({
      where: { businessId, status: "PENDING" },
    });
    if (pending) {
      throw new Error("You already have a pending Sender ID request");
    }

    const row = await prisma.businessSenderId.create({
      data: {
        businessId,
        senderId: senderId.toUpperCase(),
        status: "PENDING",
        requestedBy: userId,
      },
    });

    return apiSuccess(row, "Sender ID submitted for approval", 201);
  });
}
