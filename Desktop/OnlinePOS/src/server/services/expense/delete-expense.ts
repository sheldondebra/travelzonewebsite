import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";

export async function deleteExpense(businessId: string, expenseId: string) {
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, businessId },
  });
  if (!existing) throw new NotFoundError("Expense not found");
  await prisma.expense.delete({ where: { id: expenseId } });
  return { id: expenseId };
}
