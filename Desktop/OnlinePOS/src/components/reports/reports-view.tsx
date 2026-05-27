"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  endOfMonth,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Calendar,
  CreditCard,
  Layers,
  Package,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { useClientPagination } from "@/hooks/use-client-pagination";
import type { BusinessReports } from "@/server/services/reports/get-business-reports";

type ReportTab =
  | "overview"
  | "sales"
  | "stock"
  | "purchases"
  | "breakdown";

const TABS: { id: ReportTab; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "P&L", icon: TrendingUp },
  { id: "sales", label: "Sales", icon: ShoppingBag },
  { id: "stock", label: "Stock", icon: Boxes },
  { id: "purchases", label: "Purchases", icon: Package },
  { id: "breakdown", label: "Category & brand", icon: Layers },
];

const DATE_PRESETS = [
  {
    id: "month",
    label: "This month",
    from: () => startOfMonth(new Date()),
    to: () => new Date(),
  },
  {
    id: "last-month",
    label: "Last month",
    from: () => startOfMonth(subMonths(new Date(), 1)),
    to: () => endOfMonth(subMonths(new Date(), 1)),
  },
  {
    id: "30d",
    label: "Last 30 days",
    from: () => subDays(new Date(), 30),
    to: () => new Date(),
  },
  {
    id: "year",
    label: "This year",
    from: () => startOfYear(new Date()),
    to: () => new Date(),
  },
] as const;

function money(n: number, currency: string) {
  const sym = currency === "GHS" ? "₵" : `${currency} `;
  return `${sym}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "bg-primary/20 text-foreground",
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Wallet;
  accent?: string;
  valueClass?: string;
}) {
  return (
    <Card className="border-gray-100 shadow-soft">
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
          <p className={cn("text-xl font-semibold tabular-nums", valueClass)}>
            {value}
          </p>
          {sub && (
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  description,
  children,
  className,
  icon: Icon,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  icon?: typeof Wallet;
}) {
  return (
    <Card className={cn("border-gray-100 shadow-soft", className)}>
      <CardHeader className="border-b border-gray-50 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function PlRow({
  label,
  value,
  bold,
  negative,
  bar,
}: {
  label: string;
  value: string;
  bold?: boolean;
  negative?: boolean;
  bar?: number;
}) {
  return (
    <div className={cn("space-y-1.5", bold && "border-t border-gray-100 pt-3")}>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className={cn(bold && "font-semibold", negative && "text-muted-foreground")}>
          {label}
        </span>
        <span className={cn("tabular-nums", bold && "font-semibold")}>{value}</span>
      </div>
      {bar !== undefined && bar > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              negative ? "bg-amber-400" : "bg-emerald-500",
            )}
            style={{ width: `${Math.min(100, bar)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function SimpleBarChart({
  data,
  dataKey,
  nameKey,
  currency,
}: {
  data: { [k: string]: string | number }[];
  dataKey: string;
  nameKey: string;
  currency: string;
}) {
  if (data.length === 0) {
    return <EmptyNote>No data for this period</EmptyNote>;
  }
  return (
    <div className="h-64 min-h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey={nameKey}
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
            formatter={(v) => money(typeof v === "number" ? v : Number(v ?? 0), currency)}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #F3F4F6",
              boxShadow: "0 8px 24px -4px rgba(0,0,0,0.08)",
              fontSize: 13,
            }}
          />
          <Bar dataKey={dataKey} fill="#F8BBD0" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BreakdownSection({
  title,
  description,
  rows,
  currency,
  nameHeader,
}: {
  title: string;
  description?: string;
  rows: { name: string; quantity: number; revenue: number }[];
  currency: string;
  nameHeader: string;
}) {
  const { page, setPage, items, total, pageSize } = useClientPagination(rows);

  return (
    <SectionCard title={title} description={description}>
      {rows.length === 0 ? (
        <EmptyNote>No data in this period</EmptyNote>
      ) : (
        <>
          <div className="space-y-0 divide-y divide-gray-50 lg:hidden">
            {items.map((r) => (
              <div key={r.name} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.quantity} sold</p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {money(r.revenue, currency)}
                </p>
              </div>
            ))}
          </div>
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">{nameHeader}</TableHead>
                  <TableHead className="text-right font-semibold">Qty sold</TableHead>
                  <TableHead className="text-right font-semibold">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {money(r.revenue, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            itemName="rows"
          />
        </>
      )}
    </SectionCard>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted/70" />
      </div>
      <div className="h-20 animate-pulse rounded-2xl bg-muted/40" />
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 shrink-0 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    </div>
  );
}

export function ReportsView() {
  const [tab, setTab] = useState<ReportTab>("overview");
  const [from, setFrom] = useState(() =>
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [to, setTo] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [activePreset, setActivePreset] = useState<string>("month");

  const queryKey = useMemo(() => ["business-reports", from, to], [from, to]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/reports?${params}`);
      return parseApiResponse<BusinessReports>(res);
    },
  });

  const cur = data?.currency ?? "GHS";
  const dateReset = [from, to];
  const paymentPagination = useClientPagination(
    data?.sales.byPaymentMethod ?? [],
    undefined,
    dateReset,
  );
  const warehousePagination = useClientPagination(
    data?.stock.byWarehouse ?? [],
    undefined,
    dateReset,
  );
  const lowStockPagination = useClientPagination(
    data?.stock.lowStockItems ?? [],
    undefined,
    dateReset,
  );
  const poStatusPagination = useClientPagination(
    data?.purchases.byStatus ?? [],
    undefined,
    dateReset,
  );
  const supplierPoPagination = useClientPagination(
    data?.purchases.bySupplier ?? [],
    undefined,
    dateReset,
  );

  function applyPreset(preset: (typeof DATE_PRESETS)[number]) {
    setActivePreset(preset.id);
    setFrom(format(preset.from(), "yyyy-MM-dd"));
    setTo(format(preset.to(), "yyyy-MM-dd"));
  }

  function onFromChange(value: string) {
    setActivePreset("");
    setFrom(value);
  }

  function onToChange(value: string) {
    setActivePreset("");
    setTo(value);
  }

  const revenueMax = data?.profitAndLoss.revenue ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reports</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {data
              ? `${money(data.profitAndLoss.revenue, cur)} revenue · ${data.sales.orderCount} orders in period`
              : "Stock, sales, purchases, profit & loss, and breakdowns"}
          </p>
        </div>
        <Link
          href="/dashboard/analytics"
          className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
        >
          <BarChart3 className="mr-2 size-4" />
          Analytics
        </Link>
      </div>

      {/* Date range */}
      <Card className="border-gray-100 shadow-soft">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium">Date range</span>
            {isFetching && !isLoading && (
              <Badge variant="secondary" className="text-xs">
                Updating…
              </Badge>
            )}
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={activePreset === preset.id ? "default" : "outline"}
                className="shrink-0 rounded-xl"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5 sm:flex-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                className="rounded-xl"
                value={from}
                onChange={(e) => onFromChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:flex-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                className="rounded-xl"
                value={to}
                onChange={(e) => onToChange(e.target.value)}
              />
            </div>
          </div>
          {data && (
            <p className="text-xs text-muted-foreground">
              Showing {format(new Date(data.period.from), "MMM d, yyyy")} –{" "}
              {format(new Date(data.period.to), "MMM d, yyyy")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors touch-manipulation",
              tab === id
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-white text-muted-foreground ring-1 ring-gray-100 hover:bg-brand-rose/40",
            )}
          >
            <Icon className="size-4" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </nav>

      {isLoading ? (
        <ReportsSkeleton />
      ) : isError || !data ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-soft">
          <CardHeader>
            <CardTitle className="text-destructive">Could not load reports</CardTitle>
            <CardDescription>Try adjusting the date range or refreshing.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  label="Revenue"
                  value={money(data.profitAndLoss.revenue, cur)}
                  icon={Wallet}
                  accent="bg-primary/20 text-foreground"
                />
                <KpiCard
                  label="Net profit"
                  value={money(data.profitAndLoss.netProfit, cur)}
                  sub={`${data.profitAndLoss.margin.toFixed(1)}% margin`}
                  icon={data.profitAndLoss.netProfit >= 0 ? TrendingUp : TrendingDown}
                  accent={
                    data.profitAndLoss.netProfit >= 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }
                  valueClass={
                    data.profitAndLoss.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
                  }
                />
                <KpiCard
                  label="Gross profit"
                  value={money(data.profitAndLoss.grossProfit, cur)}
                  sub="After COGS"
                  icon={TrendingUp}
                  accent="bg-blue-100 text-blue-800"
                />
                <KpiCard
                  label="Outstanding"
                  value={money(data.cashFlow.outstandingPayments, cur)}
                  sub="Uncollected payments"
                  icon={CreditCard}
                  accent="bg-amber-100 text-amber-800"
                  valueClass="text-amber-800"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title="Profit & loss" icon={TrendingUp}>
                  <div className="space-y-4">
                    <PlRow
                      label="Revenue"
                      value={money(data.profitAndLoss.revenue, cur)}
                      bar={100}
                    />
                    <PlRow
                      label="Gross profit (COGS deducted)"
                      value={money(data.profitAndLoss.grossProfit, cur)}
                      bar={(data.profitAndLoss.grossProfit / revenueMax) * 100}
                    />
                    <PlRow
                      label="Operating expenses"
                      value={`−${money(data.profitAndLoss.expenses, cur)}`}
                      negative
                      bar={(data.profitAndLoss.expenses / revenueMax) * 100}
                    />
                    <PlRow
                      label="Net profit"
                      value={money(data.profitAndLoss.netProfit, cur)}
                      bold
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Cash flow" icon={ArrowLeftRight}>
                  <div className="space-y-4">
                    <PlRow
                      label="Collected from sales"
                      value={money(data.cashFlow.income, cur)}
                      bar={(data.cashFlow.income / Math.max(data.cashFlow.income, 1)) * 100}
                    />
                    <PlRow
                      label="Expenses paid"
                      value={`−${money(data.cashFlow.expenses, cur)}`}
                      negative
                      bar={(data.cashFlow.expenses / Math.max(data.cashFlow.income, 1)) * 100}
                    />
                    <PlRow
                      label="Net cash flow"
                      value={money(data.cashFlow.netCashFlow, cur)}
                      bold
                    />
                  </div>
                </SectionCard>
              </div>

              <SectionCard
                title="Expenses by category"
                description={`${data.profitAndLoss.expenseByCategory.length} categories`}
              >
                <ExpenseSection
                  rows={data.profitAndLoss.expenseByCategory}
                  currency={cur}
                />
              </SectionCard>
            </div>
          )}

          {tab === "sales" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Orders" value={String(data.sales.orderCount)} icon={ShoppingBag} />
                <KpiCard
                  label="Revenue"
                  value={money(data.sales.revenue, cur)}
                  icon={Wallet}
                />
                <KpiCard
                  label="Gross profit"
                  value={money(data.sales.profit, cur)}
                  icon={TrendingUp}
                  accent="bg-emerald-100 text-emerald-800"
                  valueClass="text-emerald-700"
                />
                <KpiCard
                  label="Avg order value"
                  value={money(data.sales.averageOrderValue, cur)}
                  icon={CreditCard}
                />
              </div>

              <SectionCard title="Sales by payment method" icon={CreditCard}>
                <SimpleBarChart
                  data={data.sales.byPaymentMethod.map((p) => ({
                    name: p.label,
                    revenue: p.revenue,
                  }))}
                  dataKey="revenue"
                  nameKey="name"
                  currency={cur}
                />
                {data.sales.byPaymentMethod.length > 0 && (
                  <>
                    <div className="mt-4 space-y-0 divide-y divide-gray-50 lg:hidden">
                      {paymentPagination.items.map((p) => (
                        <div
                          key={p.method}
                          className="flex items-center justify-between gap-3 py-3 first:pt-0"
                        >
                          <div>
                            <p className="font-medium">{p.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.count} orders · {money(p.collected, cur)} collected
                            </p>
                          </div>
                          <p className="font-semibold tabular-nums">{money(p.revenue, cur)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-semibold">Method</TableHead>
                            <TableHead className="text-right font-semibold">Orders</TableHead>
                            <TableHead className="text-right font-semibold">Revenue</TableHead>
                            <TableHead className="text-right font-semibold">Collected</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentPagination.items.map((p) => (
                            <TableRow key={p.method}>
                              <TableCell className="font-medium">{p.label}</TableCell>
                              <TableCell className="text-right tabular-nums">{p.count}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {money(p.revenue, cur)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {money(p.collected, cur)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <TablePagination
                        page={paymentPagination.page}
                        pageSize={paymentPagination.pageSize}
                        total={paymentPagination.total}
                        onPageChange={paymentPagination.setPage}
                        itemName="methods"
                      />
                    </div>
                  </>
                )}
              </SectionCard>
            </div>
          )}

          {tab === "stock" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  label="Products"
                  value={String(data.stock.totalProducts)}
                  icon={Package}
                />
                <KpiCard
                  label="Units on hand"
                  value={data.stock.totalUnits.toLocaleString()}
                  icon={Boxes}
                />
                <KpiCard
                  label="Inventory value"
                  value={money(data.stock.inventoryValue, cur)}
                  sub="At cost"
                  icon={Wallet}
                />
                <KpiCard
                  label="Retail value"
                  value={money(data.stock.retailValue, cur)}
                  sub={`${data.stock.lowStockCount} low · ${data.stock.outOfStockCount} out`}
                  icon={AlertTriangle}
                  accent={
                    data.stock.outOfStockCount > 0
                      ? "bg-red-100 text-red-800"
                      : data.stock.lowStockCount > 0
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                  }
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title="Stock by warehouse">
                  {data.stock.byWarehouse.length === 0 ? (
                    <EmptyNote>No warehouse stock rows — using product totals</EmptyNote>
                  ) : (
                    <>
                      <div className="space-y-0 divide-y divide-gray-50 lg:hidden">
                        {warehousePagination.items.map((w) => (
                          <div
                            key={w.warehouseId}
                            className="flex items-center justify-between gap-3 py-3 first:pt-0"
                          >
                            <div>
                              <p className="font-medium">{w.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {Math.round(w.units)} units
                              </p>
                            </div>
                            <p className="font-semibold tabular-nums">{money(w.value, cur)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="hidden lg:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableHead className="font-semibold">Warehouse</TableHead>
                              <TableHead className="text-right font-semibold">Units</TableHead>
                              <TableHead className="text-right font-semibold">Value (cost)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {warehousePagination.items.map((w) => (
                              <TableRow key={w.warehouseId}>
                                <TableCell className="font-medium">{w.name}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {Math.round(w.units)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {money(w.value, cur)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <TablePagination
                          page={warehousePagination.page}
                          pageSize={warehousePagination.pageSize}
                          total={warehousePagination.total}
                          onPageChange={warehousePagination.setPage}
                          itemName="warehouses"
                        />
                      </div>
                    </>
                  )}
                </SectionCard>

                <SectionCard
                  title="Inventory movements"
                  description="In selected period"
                  icon={Truck}
                >
                  {data.stock.movements.length === 0 ? (
                    <EmptyNote>No movements in this period</EmptyNote>
                  ) : (
                    <ul className="space-y-2">
                      {data.stock.movements.map((m) => (
                        <li
                          key={m.type}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-muted/20 px-4 py-3 text-sm"
                        >
                          <span className="font-medium">{m.type}</span>
                          <span className="text-muted-foreground">
                            {m.count} events · qty {m.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>

              <SectionCard
                title="Low stock alert"
                description="Top items needing attention"
                icon={AlertTriangle}
              >
                {data.stock.lowStockItems.length === 0 ? (
                  <div className="rounded-xl bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-800">
                    All stock levels OK
                  </div>
                ) : (
                  <>
                    <div className="space-y-0 divide-y divide-gray-50 lg:hidden">
                      {lowStockPagination.items.map((p) => (
                        <div
                          key={p.name + (p.sku ?? "")}
                          className="flex items-center justify-between gap-3 py-3 first:pt-0"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku ?? "No SKU"}</p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              p.quantity === 0
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-900"
                            }
                          >
                            {p.quantity} / {p.alert}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-semibold">Product</TableHead>
                            <TableHead className="font-semibold">SKU</TableHead>
                            <TableHead className="text-right font-semibold">Qty</TableHead>
                            <TableHead className="text-right font-semibold">Alert at</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lowStockPagination.items.map((p) => (
                            <TableRow key={p.name + (p.sku ?? "")}>
                              <TableCell className="font-medium">{p.name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {p.sku ?? "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="secondary"
                                  className={
                                    p.quantity === 0
                                      ? "bg-red-100 text-red-800"
                                      : "bg-amber-100 text-amber-900"
                                  }
                                >
                                  {p.quantity}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {p.alert}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <TablePagination
                        page={lowStockPagination.page}
                        pageSize={lowStockPagination.pageSize}
                        total={lowStockPagination.total}
                        onPageChange={lowStockPagination.setPage}
                        itemName="products"
                      />
                    </div>
                  </>
                )}
              </SectionCard>
            </div>
          )}

          {tab === "purchases" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  label="Purchase orders"
                  value={String(data.purchases.orderCount)}
                  icon={Package}
                />
                <KpiCard
                  label="Total PO value"
                  value={money(data.purchases.totalAmount, cur)}
                  icon={Wallet}
                />
                <KpiCard
                  label="Units ordered"
                  value={data.purchases.unitsOrdered.toLocaleString()}
                  icon={ShoppingBag}
                />
                <KpiCard
                  label="Units received"
                  value={data.purchases.unitsReceived.toLocaleString()}
                  icon={Truck}
                  accent="bg-emerald-100 text-emerald-800"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title="By status">
                  <SimpleBarChart
                    data={data.purchases.byStatus.map((s) => ({
                      name: s.status,
                      amount: s.amount,
                    }))}
                    dataKey="amount"
                    nameKey="name"
                    currency={cur}
                  />
                  {data.purchases.byStatus.length > 0 && (
                    <div className="mt-4 hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right font-semibold">Count</TableHead>
                            <TableHead className="text-right font-semibold">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {poStatusPagination.items.map((s) => (
                            <TableRow key={s.status}>
                              <TableCell>
                                <Badge variant="secondary">{s.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{s.count}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {money(s.amount, cur)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <TablePagination
                        page={poStatusPagination.page}
                        pageSize={poStatusPagination.pageSize}
                        total={poStatusPagination.total}
                        onPageChange={poStatusPagination.setPage}
                        itemName="statuses"
                      />
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="By supplier">
                  {data.purchases.bySupplier.length === 0 ? (
                    <EmptyNote>No purchases in this period</EmptyNote>
                  ) : (
                    <>
                      <div className="space-y-0 divide-y divide-gray-50 lg:hidden">
                        {supplierPoPagination.items.map((s) => (
                          <div
                            key={s.name}
                            className="flex items-center justify-between gap-3 py-3 first:pt-0"
                          >
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.count} POs</p>
                            </div>
                            <p className="font-semibold tabular-nums">{money(s.amount, cur)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="hidden lg:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableHead className="font-semibold">Supplier</TableHead>
                              <TableHead className="text-right font-semibold">POs</TableHead>
                              <TableHead className="text-right font-semibold">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {supplierPoPagination.items.map((s) => (
                              <TableRow key={s.name}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell className="text-right tabular-nums">{s.count}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {money(s.amount, cur)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <TablePagination
                          page={supplierPoPagination.page}
                          pageSize={supplierPoPagination.pageSize}
                          total={supplierPoPagination.total}
                          onPageChange={supplierPoPagination.setPage}
                          itemName="suppliers"
                        />
                      </div>
                    </>
                  )}
                </SectionCard>
              </div>
            </div>
          )}

          {tab === "breakdown" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <BreakdownSection
                title="Sales by category"
                description={`${data.sales.orderCount} orders in period`}
                rows={data.sales.byCategory}
                currency={cur}
                nameHeader="Category"
              />
              <BreakdownSection
                title="Sales by brand"
                rows={data.sales.byBrand}
                currency={cur}
                nameHeader="Brand"
              />
              <SectionCard
                title="Payment methods"
                description="Revenue breakdown"
                icon={Wallet}
                className="lg:col-span-2"
              >
                <SimpleBarChart
                  data={data.sales.byPaymentMethod.map((p) => ({
                    name: p.label,
                    revenue: p.revenue,
                  }))}
                  dataKey="revenue"
                  nameKey="name"
                  currency={cur}
                />
              </SectionCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExpenseSection({
  rows,
  currency,
}: {
  rows: { category: string; amount: number }[];
  currency: string;
}) {
  const { page, setPage, items, total, pageSize } = useClientPagination(rows);

  if (rows.length === 0) {
    return <EmptyNote>No expenses recorded in this period</EmptyNote>;
  }

  const max = Math.max(...rows.map((r) => r.amount), 1);

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {items.map((e) => (
          <div key={e.category} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{e.category}</span>
              <span className="tabular-nums">{money(e.amount, currency)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${(e.amount / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="text-right font-semibold">Amount</TableHead>
              <TableHead className="w-40 font-semibold">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((e) => (
              <TableRow key={e.category}>
                <TableCell className="font-medium">{e.category}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(e.amount, currency)}
                </TableCell>
                <TableCell>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(e.amount / max) * 100}%` }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        itemName="categories"
      />
    </>
  );
}
