import { prisma } from "@/lib/prisma";
import type { PaymentMethod } from "@/generated/prisma/client";
import { NotFoundError } from "@/server/utils/errors";

export async function buildRegisterReport(
  businessId: string,
  sessionId: string,
  type: "X" | "Z",
) {
  const session = await prisma.registerSession.findFirst({
    where: { id: sessionId, businessId },
    include: {
      cashier: { select: { id: true, name: true } },
      cashMovements: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!session) throw new NotFoundError("Register session not found");

  const orders = await prisma.order.findMany({
    where: {
      businessId,
      registerSessionId: sessionId,
      saleStatus: "COMPLETED",
    },
    include: { payments: true },
  });

  const paymentTotals: Record<string, number> = {};
  let cashSales = 0;
  let totalSales = 0;

  for (const order of orders) {
    totalSales += order.totalAmount;
    if (order.payments.length) {
      for (const p of order.payments) {
        paymentTotals[p.method] = (paymentTotals[p.method] ?? 0) + p.amount;
        if (p.method === "CASH") cashSales += p.amount;
      }
    } else if (order.paymentMethod) {
      const method = order.paymentMethod;
      const paid = order.amountPaid || order.totalAmount;
      paymentTotals[method] = (paymentTotals[method] ?? 0) + paid;
      if (method === "CASH") cashSales += paid;
    }
  }

  const cashIn = session.cashMovements
    .filter((m) => m.type === "CASH_IN")
    .reduce((s, m) => s + m.amount, 0);
  const cashOut = session.cashMovements
    .filter((m) => m.type === "CASH_OUT")
    .reduce((s, m) => s + m.amount, 0);

  return {
    type,
    session: {
      id: session.id,
      status: session.status,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      cashier: session.cashier,
      openingFloat: session.openingFloat,
      expectedCash: session.expectedCash,
      countedCash: session.countedCash,
      difference: session.difference,
    },
    salesCount: orders.length,
    totalSales,
    cashSales,
    cashIn,
    cashOut,
    paymentTotals: paymentTotals as Partial<Record<PaymentMethod, number>>,
    movements: session.cashMovements,
    generatedAt: new Date().toISOString(),
  };
}
