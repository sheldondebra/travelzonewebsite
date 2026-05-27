import { paginatedResult, type Paginated } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export async function listExpenses(
  businessId: string,
  opts?: { from?: Date; to?: Date; limit?: number },
) {
  const where = buildExpenseWhere(businessId, opts);

  return prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: opts?.limit ?? 100,
  });
}

export async function listExpensesPaginated(
  businessId: string,
  opts: {
    from?: Date;
    to?: Date;
    category?: string;
    page: number;
    pageSize: number;
  },
): Promise<Paginated<Awaited<ReturnType<typeof listExpenses>>[number]>> {
  const where = buildExpenseWhere(businessId, opts);
  const { page, pageSize, category } = opts;
  const fullWhere = {
    ...where,
    ...(category && category !== "all" ? { category } : {}),
  };

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where: fullWhere }),
    prisma.expense.findMany({
      where: fullWhere,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return paginatedResult(expenses, total, page, pageSize);
}

function buildExpenseWhere(
  businessId: string,
  opts?: { from?: Date; to?: Date },
) {
  return {
    businessId,
    ...(opts?.from || opts?.to
      ? {
          date: {
            ...(opts.from ? { gte: opts.from } : {}),
            ...(opts.to ? { lte: opts.to } : {}),
          },
        }
      : {}),
  };
}

export async function getExpenseTotal(
  businessId: string,
  from?: Date,
  to?: Date,
) {
  const result = await prisma.expense.aggregate({
    where: buildExpenseWhere(businessId, { from, to }),
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}
