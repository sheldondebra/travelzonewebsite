"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  BarChart3,
  Package,
  Star,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { useClientPagination } from "@/hooks/use-client-pagination";

type Overview = {
  currency: string;
  revenue: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  orderCount: number;
  customerCount: number;
  productCount: number;
  month: { revenue: number; expenses: number };
};

type AdvancedData = {
  overview: Overview;
  monthlyTrends: {
    month: string;
    revenue: number;
    profit: number;
    orders: number;
    expenses: number;
  }[];
  topCustomers: { customerId: string; name: string; spending: number }[];
  customerGrowth: { newLast30Days: number };
  reputation: {
    avgRating: number;
    reviewCount: number;
    deliverySuccessRate: number;
  };
  forecasts: {
    revenueGrowthPercent: number;
    projectedMonthlyRevenue: number;
  };
};

function money(amount: number, currency: string) {
  const sym = currency === "GHS" ? "₵" : `${currency} `;
  return `${sym}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtChart(value: number, currency: string) {
  return money(value, currency);
}

export function AdvancedAnalyticsView() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics-advanced"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/advanced");
      return parseApiResponse<AdvancedData>(res);
    },
  });

  const topCustomersPagination = useClientPagination(data?.topCustomers ?? []);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-soft">
        <CardHeader>
          <CardTitle className="text-destructive">Could not load analytics</CardTitle>
          <CardDescription>Try refreshing the page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const cur = data.overview.currency;
  const growth = data.forecasts.revenueGrowthPercent;
  const growthUp = growth >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {money(data.overview.revenue, cur)} total revenue ·{" "}
            {data.overview.orderCount} orders · {data.overview.customerCount} customers
          </p>
        </div>
        <Link
          href="/dashboard/reports"
          className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
        >
          <BarChart3 className="mr-2 size-4" />
          Full reports
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Net profit",
            value: money(data.overview.netProfit, cur),
            sub: `${data.overview.profitMargin.toFixed(1)}% margin`,
            icon: Wallet,
            accent: "bg-emerald-100 text-emerald-800",
          },
          {
            label: "This month",
            value: money(data.overview.month.revenue, cur),
            sub: `${money(data.overview.month.expenses, cur)} expenses`,
            icon: TrendingUp,
            accent: "bg-primary/20 text-foreground",
          },
          {
            label: "New customers",
            value: String(data.customerGrowth.newLast30Days),
            sub: "Last 30 days",
            icon: Users,
            accent: "bg-blue-100 text-blue-800",
          },
          {
            label: "Revenue growth",
            value: `${growthUp ? "+" : ""}${growth.toFixed(1)}%`,
            sub: "vs previous month",
            icon: growthUp ? TrendingUp : TrendingDown,
            accent: growthUp
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800",
          },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <Card key={label} className="border-gray-100 shadow-soft">
            <CardContent className="flex items-center gap-4 p-4">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  accent,
                )}
              >
                <Icon className="size-5" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="text-xl font-semibold tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All-time financial bar chart */}
      <AnalyticsCharts
        revenue={data.overview.revenue}
        profit={data.overview.grossProfit}
        expenses={data.overview.expenses}
        currency={cur}
      />

      {/* Monthly charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-gray-100 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue & profit</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 min-h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.monthlyTrends}
                  margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F8BBD0" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#F8BBD0" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #F3F4F6",
                      boxShadow: "0 8px 24px -4px rgba(0,0,0,0.08)",
                      fontSize: 13,
                    }}
                    formatter={(value, name) => [
                      fmtChart(Number(value ?? 0), cur),
                      name === "revenue" ? "Revenue" : "Net profit",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#F8BBD0"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fill="url(#profitGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Orders & expenses</CardTitle>
            <CardDescription>Monthly activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 min-h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.monthlyTrends}
                  margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="left"
                    allowDecimals={false}
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="expenses"
                    orientation="right"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #F3F4F6",
                      fontSize: 13,
                    }}
                    formatter={(value, name) =>
                      name === "orders"
                        ? [`${value} orders`, "Orders"]
                        : [fmtChart(Number(value ?? 0), cur), "Expenses"]
                    }
                  />
                  <Bar
                    yAxisId="orders"
                    dataKey="orders"
                    fill="#F8BBD0"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                    name="orders"
                  />
                  <Bar
                    yAxisId="expenses"
                    dataKey="expenses"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                    name="expenses"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reputation mini stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Avg rating",
            value: data.reputation.reviewCount > 0
              ? `${data.reputation.avgRating.toFixed(1)} ★`
              : "No reviews",
            icon: Star,
          },
          {
            label: "Reviews",
            value: String(data.reputation.reviewCount),
            icon: Star,
          },
          {
            label: "Delivery success",
            value: `${data.reputation.deliverySuccessRate.toFixed(0)}%`,
            icon: Truck,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-gray-100 shadow-soft">
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold tabular-nums">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Top customers */}
        <Card className="border-gray-100 shadow-soft lg:col-span-3">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-base">Top customers</CardTitle>
            <CardDescription>Highest spenders in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.topCustomers.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No customer orders in the last 30 days
              </p>
            ) : (
              <>
                <div className="space-y-0 divide-y divide-gray-50 p-4 lg:hidden">
                  {topCustomersPagination.items.map((c, i) => (
                    <div
                      key={c.customerId}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold tabular-nums">
                        {(topCustomersPagination.page - 1) * topCustomersPagination.pageSize + i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">30-day spending</p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums">
                        {money(c.spending, cur)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-12 font-semibold">#</TableHead>
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="text-right font-semibold">Spent (30d)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomersPagination.items.map((c, i) => (
                        <TableRow key={c.customerId}>
                          <TableCell className="font-medium text-muted-foreground">
                            {(topCustomersPagination.page - 1) * topCustomersPagination.pageSize + i + 1}
                          </TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {money(c.spending, cur)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  page={topCustomersPagination.page}
                  pageSize={topCustomersPagination.pageSize}
                  total={topCustomersPagination.total}
                  onPageChange={topCustomersPagination.setPage}
                  itemName="customers"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Forecast */}
        <Card className="border-primary/25 bg-gradient-to-br from-brand-cream/80 to-brand-rose/30 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="size-4" />
              Forecast
            </CardTitle>
            <CardDescription>Projection from recent growth trend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Next month revenue
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {money(data.forecasts.projectedMonthlyRevenue, cur)}
              </p>
            </div>
            <Badge variant={growthUp ? "default" : "secondary"}>
              {growthUp ? "+" : ""}
              {growth.toFixed(1)}% vs last month
            </Badge>
            <div className="rounded-xl bg-white/70 p-3 text-sm text-muted-foreground">
              Based on your last two months of sales. Use{" "}
              <Link href="/dashboard/reports" className="font-medium text-foreground underline">
                Reports
              </Link>{" "}
              for detailed P&amp;L.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Catalog snapshot */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-gray-100 shadow-soft">
          <CardContent className="flex items-center gap-4 p-4">
            <Package className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Products in catalog
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {data.overview.productCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-soft">
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total customers
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {data.overview.customerCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted/70" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-muted/40" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-muted/40" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    </div>
  );
}
