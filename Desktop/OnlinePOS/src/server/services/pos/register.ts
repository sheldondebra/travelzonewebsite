import { prisma } from "@/lib/prisma";
import { AppError, NotFoundError } from "@/server/utils/errors";
import { logActivity } from "@/server/utils/activity";

function assertRegisterModel() {
  if (
    typeof prisma.registerSession?.findFirst !== "function"
  ) {
    throw new AppError(
      "POS register is not ready. Stop the dev server, run: npx prisma generate && npx prisma migrate deploy, then start again.",
      503,
    );
  }
}

export async function getOpenRegisterSession(businessId: string) {
  assertRegisterModel();
  return prisma.registerSession.findFirst({
    where: { businessId, status: "OPEN" },
    orderBy: { openedAt: "desc" },
    include: {
      cashier: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function openRegisterSession(
  businessId: string,
  cashierId: string,
  openingFloat: number,
  openingNote?: string,
) {
  const existing = await getOpenRegisterSession(businessId);
  if (existing) {
    throw new AppError("Register is already open", 409);
  }

  const session = await prisma.registerSession.create({
    data: {
      businessId,
      cashierId,
      openingFloat,
      expectedCash: openingFloat,
      openingNote,
    },
    include: {
      cashier: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    businessId,
    userId: cashierId,
    action: "opened",
    entity: "register",
    entityId: session.id,
    details: `Opening float ${openingFloat}`,
  });

  return session;
}

export async function closeRegisterSession(
  businessId: string,
  userId: string,
  sessionId: string,
  countedCash: number,
  closingNote?: string,
) {
  const session = await prisma.registerSession.findFirst({
    where: { id: sessionId, businessId, status: "OPEN" },
  });
  if (!session) throw new NotFoundError("Open register session not found");

  const difference = countedCash - session.expectedCash;

  const closed = await prisma.registerSession.update({
    where: { id: sessionId },
    data: {
      status: "CLOSED",
      countedCash,
      difference,
      closingNote,
      closedAt: new Date(),
    },
    include: {
      cashier: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    businessId,
    userId,
    action: "closed",
    entity: "register",
    entityId: sessionId,
    details: `Counted ${countedCash}, difference ${difference}`,
  });

  return closed;
}

export async function recordCashMovement(
  businessId: string,
  userId: string,
  sessionId: string,
  type: "CASH_IN" | "CASH_OUT",
  amount: number,
  reason: string,
) {
  const session = await prisma.registerSession.findFirst({
    where: { id: sessionId, businessId, status: "OPEN" },
  });
  if (!session) throw new NotFoundError("Open register session not found");

  const delta = type === "CASH_IN" ? amount : -amount;

  const [movement] = await prisma.$transaction([
    prisma.cashMovement.create({
      data: {
        businessId,
        registerSessionId: sessionId,
        cashierId: userId,
        type,
        amount,
        reason,
      },
    }),
    prisma.registerSession.update({
      where: { id: sessionId },
      data: { expectedCash: { increment: delta } },
    }),
  ]);

  await logActivity({
    businessId,
    userId,
    action: type === "CASH_IN" ? "cash_in" : "cash_out",
    entity: "register",
    entityId: sessionId,
    details: `${amount} — ${reason}`,
  });

  return movement;
}

export async function bumpRegisterExpectedCash(
  registerSessionId: string,
  cashAmount: number,
) {
  if (cashAmount <= 0) return;
  await prisma.registerSession.update({
    where: { id: registerSessionId },
    data: { expectedCash: { increment: cashAmount } },
  });
}
