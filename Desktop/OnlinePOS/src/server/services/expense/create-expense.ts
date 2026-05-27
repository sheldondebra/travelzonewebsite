import { prisma } from "@/lib/prisma";
import { logActivity } from "@/server/utils/activity";
import type { CreateExpenseInput } from "@/server/validations/expense";

export async function createExpense(
  businessId: string,
  input: CreateExpenseInput,
  userId?: string | null,
) {
  const expense = await prisma.expense.create({
    data: {
      ...input,
      date: input.date ?? new Date(),
      businessId,
    },
  });

  await logActivity({
    businessId,
    userId,
    action: "created",
    entity: "expense",
    entityId: expense.id,
    details: `${input.title} — ${input.amount}`,
  });

  return expense;
}
