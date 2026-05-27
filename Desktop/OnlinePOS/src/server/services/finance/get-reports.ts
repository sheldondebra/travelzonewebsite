import { prisma } from "@/lib/prisma";
import { getExpenseTotal } from "@/server/services/expense/list-expenses";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getFinancialReports(
  businessId: string,
  from?: Date,
  to?: Date,
) {
  const start = from ?? startOfMonth(new Date());
  const end = to ?? endOfMonth(new Date());

  const [orders, expensesTotal, expensesByCategory, outstanding] =
    await Promise.all([
      prisma.order.aggregate({
        where: { businessId, createdAt: { gte: start, lte: end } },
        _sum: { totalAmount: true, profit: true, amountPaid: true },
        _count: true,
      }),
      getExpenseTotal(businessId, start, end),
      prisma.expense.groupBy({
        by: ["category"],
        where: { businessId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: {
          businessId,
          paymentStatus: { in: ["pending", "partially_paid"] },
        },
        _sum: { totalAmount: true, amountPaid: true },
      }),
    ]);

  const revenue = orders._sum.totalAmount ?? 0;
  const grossProfit = orders._sum.profit ?? 0;
  const netProfit = grossProfit - expensesTotal;
  const outstandingAmount =
    (outstanding._sum.totalAmount ?? 0) -
    (outstanding._sum.amountPaid ?? 0);

  return {
    period: { from: start, to: end },
    profitAndLoss: {
      revenue,
      grossProfit,
      expenses: expensesTotal,
      netProfit,
      margin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    },
    expenseSummary: expensesByCategory.map((e) => ({
      category: e.category,
      amount: e._sum.amount ?? 0,
    })),
    salesSummary: {
      orderCount: orders._count,
      revenue,
      collected: orders._sum.amountPaid ?? 0,
    },
    cashFlow: {
      income: orders._sum.amountPaid ?? 0,
      expenses: expensesTotal,
      netCashFlow: (orders._sum.amountPaid ?? 0) - expensesTotal,
      outstandingPayments: outstandingAmount,
    },
  };
}
