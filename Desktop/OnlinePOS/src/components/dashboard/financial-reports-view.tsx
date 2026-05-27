"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseApiResponse } from "@/lib/api-client";
import { TablePagination } from "@/components/ui/table-pagination";
import { useClientPagination } from "@/hooks/use-client-pagination";

type ReportData = {
  period: { from: string; to: string };
  profitAndLoss: {
    revenue: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    margin: number;
  };
  expenseSummary: { category: string; amount: number }[];
  salesSummary: { orderCount: number; revenue: number; collected: number };
  cashFlow: {
    income: number;
    expenses: number;
    netCashFlow: number;
    outstandingPayments: number;
  };
};

export function FinancialReportsView() {
  const { data, isLoading } = useQuery({
    queryKey: ["financial-reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports/financial");
      return parseApiResponse<ReportData>(res);
    },
  });

  const {
    page,
    setPage,
    items: expenseRows,
    total,
    pageSize,
  } = useClientPagination(data?.expenseSummary ?? []);

  if (isLoading || !data) {
    return <p className="text-muted-foreground text-sm">Generating reports...</p>;
  }

  const pl = data.profitAndLoss;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Financial reports</h1>
        <p className="text-muted-foreground">
          {format(new Date(data.period.from), "MMM d")} –{" "}
          {format(new Date(data.period.to), "MMM d, yyyy")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue</CardDescription>
            <CardTitle>{pl.revenue.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net profit</CardDescription>
            <CardTitle className="text-green-700">
              {pl.netProfit.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Margin</CardDescription>
            <CardTitle>{pl.margin.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding</CardDescription>
            <CardTitle>
              {data.cashFlow.outstandingPayments.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit & loss</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Gross profit</span>
              <span>{pl.grossProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Expenses</span>
              <span>-{pl.expenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Net profit</span>
              <span>{pl.netProfit.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Collected</span>
              <span>{data.cashFlow.income.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid out (expenses)</span>
              <span>-{data.cashFlow.expenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Net cash flow</span>
              <span>{data.cashFlow.netCashFlow.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenses by category</CardTitle>
          <CardDescription>{data.salesSummary.orderCount} orders this period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseRows.map((e) => (
                <TableRow key={e.category}>
                  <TableCell>{e.category}</TableCell>
                  <TableCell className="text-right">
                    {e.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {total > 0 && (
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              itemName="categories"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
