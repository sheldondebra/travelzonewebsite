"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format, startOfMonth, subDays } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  Loader2,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { BusinessReports } from "@/server/services/reports/get-business-reports";
import {
  getReportDefinition,
  REPORT_DEFINITIONS,
  type ReportId,
} from "@/components/reports/report-definitions";

function money(n: number, currency: string) {
  const sym = currency === "GHS" ? "₵" : `${currency} `;
  return `${sym}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function number(n: number) {
  return n.toLocaleString();
}

function dateLabel(value: Date | string | null | undefined, pattern = "MMM d, yyyy") {
  if (!value) return "—";
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : format(parsed, pattern);
}

export function ReportDetailView({ reportId }: { reportId: ReportId }) {
  const [from, setFrom] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [to, setTo] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const definition = getReportDefinition(reportId)!;
  const Icon = definition.icon;

  const queryKey = useMemo(() => ["report-detail", reportId, from, to], [reportId, from, to]);
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/reports?${params}`);
      return parseApiResponse<BusinessReports>(res);
    },
  });

  const cur = data?.currency ?? "GHS";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-gradient-to-br from-brand-cream via-white to-brand-rose/35 p-5 shadow-soft sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm",
              definition.accent,
            )}
          >
            <Icon className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Reports Center
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {definition.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {definition.description}
            </p>
          </div>
        </div>
        <DateRangeControls
          from={from}
          to={to}
          isFetching={isFetching}
          onFromChange={setFrom}
          onToChange={setTo}
        />
      </div>

      <ReportNav active={reportId} />

      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-soft">
          <CardHeader>
            <CardTitle className="text-destructive">Could not load report</CardTitle>
            <CardDescription>Try another date range or refresh the page.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ReportBody reportId={reportId} data={data} currency={cur} />
      )}
    </div>
  );
}

function DateRangeControls({
  from,
  to,
  isFetching,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  isFetching: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <Card className="border-primary/10 bg-white/90 shadow-card lg:min-w-[430px]">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="size-4 text-muted-foreground" />
            Date range
          </div>
          {isFetching && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Loader2 className="size-3 animate-spin" />
              Updating
            </Badge>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={from}
              className="h-10 rounded-xl"
              onChange={(e) => onFromChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={to}
              className="h-10 rounded-xl"
              onChange={(e) => onToChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onFromChange(format(subDays(new Date(), 30), "yyyy-MM-dd"));
              onToChange(format(new Date(), "yyyy-MM-dd"));
            }}
          >
            Last 30 days
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onFromChange(format(startOfMonth(new Date()), "yyyy-MM-dd"));
              onToChange(format(new Date(), "yyyy-MM-dd"));
            }}
          >
            This month
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportNav({ active }: { active: ReportId }) {
  return (
    <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {REPORT_DEFINITIONS.map((report) => (
        <ReportNavLink key={report.id} report={report} active={active === report.id} />
      ))}
    </nav>
  );
}

function ReportNavLink({
  report,
  active,
}: {
  report: (typeof REPORT_DEFINITIONS)[number];
  active: boolean;
}) {
  const Icon = report.icon;

  return (
    <Link
      href={`/dashboard/reports/${report.id}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "bg-white text-muted-foreground ring-1 ring-gray-100 hover:bg-brand-rose/40 hover:text-foreground",
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {report.shortTitle}
    </Link>
  );
}

function ReportBody({
  reportId,
  data,
  currency,
}: {
  reportId: ReportId;
  data: BusinessReports;
  currency: string;
}) {
  switch (reportId) {
    case "sales":
      return <SalesReport data={data} currency={currency} />;
    case "profit-loss":
      return <ProfitLossReport data={data} currency={currency} />;
    case "payments":
      return <PaymentsReport data={data} currency={currency} />;
    case "stock":
      return <StockReport data={data} currency={currency} />;
    case "purchases":
      return <PurchasesReport data={data} currency={currency} />;
    case "products":
      return <ProductsReport data={data} currency={currency} />;
    case "customers":
      return <CustomersReport data={data} currency={currency} />;
    case "delivery":
      return <DeliveryReport data={data} currency={currency} />;
    case "expenses":
      return <ExpensesReport data={data} currency={currency} />;
    case "cash-flow":
      return <CashFlowReport data={data} currency={currency} />;
  }
}

function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon = Wallet,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: typeof Wallet;
}) {
  return (
    <Card className="border-gray-100 shadow-card">
      <CardContent className="flex items-center gap-4 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-foreground">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
          {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-gray-100 shadow-soft">
      <CardHeader className="border-b border-gray-50 pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function EmptyRows() {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
      No data for this period.
    </div>
  );
}

function SalesReport({ data, currency }: ReportProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <Kpi label="Orders" value={number(data.sales.orderCount)} />
        <Kpi label="Revenue" value={money(data.sales.revenue, currency)} />
        <Kpi label="Gross profit" value={money(data.sales.profit, currency)} />
        <Kpi label="Average order" value={money(data.sales.averageOrderValue, currency)} />
      </KpiGrid>
      <BreakdownTable
        title="Sales by category"
        rows={data.sales.byCategory}
        currency={currency}
      />
      <BreakdownTable title="Sales by brand" rows={data.sales.byBrand} currency={currency} />
    </div>
  );
}

function ProfitLossReport({ data, currency }: ReportProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <Kpi label="Revenue" value={money(data.profitAndLoss.revenue, currency)} />
        <Kpi label="Gross profit" value={money(data.profitAndLoss.grossProfit, currency)} />
        <Kpi label="Expenses" value={money(data.profitAndLoss.expenses, currency)} />
        <Kpi
          label="Net profit"
          value={money(data.profitAndLoss.netProfit, currency)}
          sub={`${data.profitAndLoss.margin.toFixed(1)}% margin`}
        />
      </KpiGrid>
      <Section title="Profit & loss details">
        <div className="space-y-3 text-sm">
          <MetricLine label="Revenue" value={money(data.profitAndLoss.revenue, currency)} />
          <MetricLine label="Gross profit" value={money(data.profitAndLoss.grossProfit, currency)} />
          <MetricLine label="Operating expenses" value={money(data.profitAndLoss.expenses, currency)} />
          <MetricLine label="Net profit" value={money(data.profitAndLoss.netProfit, currency)} bold />
        </div>
      </Section>
    </div>
  );
}

function PaymentsReport({ data, currency }: ReportProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <Kpi label="Collected" value={money(data.sales.collected, currency)} />
        <Kpi label="Outstanding" value={money(data.cashFlow.outstandingPayments, currency)} />
        <Kpi label="Payment methods" value={number(data.sales.byPaymentMethod.length)} />
        <Kpi label="Orders" value={number(data.sales.orderCount)} />
      </KpiGrid>
      <Section title="Payment methods">
        {data.sales.byPaymentMethod.length === 0 ? (
          <EmptyRows />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Collected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sales.byPaymentMethod.map((row) => (
                <TableRow key={row.method}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">{money(row.revenue, currency)}</TableCell>
                  <TableCell className="text-right">{money(row.collected, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </div>
  );
}

function StockReport({ data, currency }: ReportProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <Kpi label="Products" value={number(data.stock.totalProducts)} />
        <Kpi label="Units on hand" value={number(data.stock.totalUnits)} />
        <Kpi label="Inventory value" value={money(data.stock.inventoryValue, currency)} />
        <Kpi label="Low / out" value={`${data.stock.lowStockCount} / ${data.stock.outOfStockCount}`} />
      </KpiGrid>
      <Section title="Stock by warehouse">
        {data.stock.byWarehouse.length === 0 ? (
          <EmptyRows />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Cost value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.stock.byWarehouse.map((row) => (
                <TableRow key={row.warehouseId}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="text-right">{Math.round(row.units)}</TableCell>
                  <TableCell className="text-right">{money(row.value, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
      <Section title="Low stock products">
        {data.stock.lowStockItems.length === 0 ? (
          <EmptyRows />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Alert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.stock.lowStockItems.map((row) => (
                <TableRow key={`${row.name}-${row.sku ?? ""}`}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.sku ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell className="text-right">{row.alert}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </div>
  );
}

function PurchasesReport({ data, currency }: ReportProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <Kpi label="Purchase orders" value={number(data.purchases.orderCount)} />
        <Kpi label="Total value" value={money(data.purchases.totalAmount, currency)} />
        <Kpi label="Units ordered" value={number(data.purchases.unitsOrdered)} />
        <Kpi label="Units received" value={number(data.purchases.unitsReceived)} />
      </KpiGrid>
      <AmountTable title="Purchases by status" rows={data.purchases.byStatus.map((r) => ({ name: r.status, count: r.count, amount: r.amount }))} currency={currency} />
      <AmountTable title="Purchases by supplier" rows={data.purchases.bySupplier.map((r) => ({ name: r.name, count: r.count, amount: r.amount }))} currency={currency} />
    </div>
  );
}

function ProductsReport({ data, currency }: ReportProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <Kpi label="Total products" value={number(data.products.totalProducts)} />
        <Kpi label="Sold products" value={number(data.products.soldProducts)} />
        <Kpi label="Unsold products" value={number(data.products.unsoldProducts)} />
        <Kpi label="Stock units" value={number(data.stock.totalUnits)} />
      </KpiGrid>
      <Section title="Top products by revenue">
        {data.products.topProducts.length === 0 ? <EmptyRows /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.products.topProducts.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.sku ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell className="text-right">{money(row.revenue, currency)}</TableCell>
                  <TableCell className="text-right">{row.stockQuantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
      <Section title="Unsold products with stock value">
        {data.products.unsold.length === 0 ? <EmptyRows /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Retail value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.products.unsold.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.sku ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.stockQuantity}</TableCell>
                  <TableCell className="text-right">{money(row.retailValue, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </div>
  );
}

function CustomersReport({ data, currency }: ReportProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <Kpi label="Customers" value={number(data.customers.totalCustomers)} />
        <Kpi label="Repeat customers" value={number(data.customers.repeatCustomers)} />
        <Kpi label="Outstanding customers" value={number(data.customers.outstanding.length)} />
        <Kpi label="Revenue" value={money(data.sales.revenue, currency)} />
      </KpiGrid>
      <CustomerTable title="Top customers" rows={data.customers.topCustomers} currency={currency} />
      <CustomerTable title="Outstanding balances" rows={data.customers.outstanding} currency={currency} />
    </div>
  );
}

function DeliveryReport({ data, currency }: ReportProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <Kpi label="Delivery orders" value={number(data.delivery.totalOrders)} />
        <Kpi label="Active deliveries" value={number(data.delivery.activeOrders)} />
        <Kpi label="Delivered" value={number(data.delivery.deliveredOrders)} />
        <Kpi label="Scheduled" value={number(data.delivery.scheduledOrders)} />
      </KpiGrid>
      <AmountTable
        title="Delivery status"
        rows={data.delivery.byStatus.map((r) => ({ name: r.label, count: r.count, amount: r.value }))}
        currency={currency}
      />
      <AmountTable
        title="Delivery by rider"
        rows={data.delivery.byRider.map((r) => ({ name: r.phone ? `${r.name} · ${r.phone}` : r.name, count: r.count, amount: r.value }))}
        currency={currency}
      />
      <AmountTable
        title="Delivery by city / region"
        rows={data.delivery.byLocation.map((r) => ({ name: r.name, count: r.count, amount: r.value }))}
        currency={currency}
      />
      <Section title="Delivery order details" description="Rider, city, scheduled date, customer phone, tracking, and order value.">
        {data.delivery.rows.length === 0 ? <EmptyRows /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rider</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.delivery.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.reference ?? row.id.slice(0, 8)}</TableCell>
                  <TableCell>{dateLabel(row.createdAt)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{row.customerName}</div>
                    <div className="text-xs text-muted-foreground">{row.customerPhone ?? "No phone"}</div>
                  </TableCell>
                  <TableCell>{row.statusLabel}</TableCell>
                  <TableCell>
                    <div>{row.riderName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{row.riderPhone ?? ""}</div>
                  </TableCell>
                  <TableCell>{[row.city, row.region].filter(Boolean).join(", ") || "—"}</TableCell>
                  <TableCell>{dateLabel(row.scheduledAt)}</TableCell>
                  <TableCell>{row.trackingNumber ?? "—"}</TableCell>
                  <TableCell className="text-right">{money(row.totalAmount, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </div>
  );
}

function ExpensesReport({ data, currency }: ReportProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <Kpi label="Total expenses" value={money(data.expenses.total, currency)} />
        <Kpi label="Categories" value={number(data.expenses.byCategory.length)} />
        <Kpi label="Revenue" value={money(data.profitAndLoss.revenue, currency)} />
        <Kpi label="Net profit" value={money(data.profitAndLoss.netProfit, currency)} />
      </KpiGrid>
      <Section title="Expenses by category">
        {data.expenses.byCategory.length === 0 ? <EmptyRows /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.expenses.byCategory.map((row) => (
                <TableRow key={row.category}>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="text-right">{money(row.amount, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </div>
  );
}

function CashFlowReport({ data, currency }: ReportProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <Kpi label="Income collected" value={money(data.cashFlow.income, currency)} />
        <Kpi label="Expenses" value={money(data.cashFlow.expenses, currency)} />
        <Kpi label="Net cash flow" value={money(data.cashFlow.netCashFlow, currency)} />
        <Kpi label="Outstanding" value={money(data.cashFlow.outstandingPayments, currency)} />
      </KpiGrid>
      <Section title="Cash flow detail">
        <div className="space-y-3 text-sm">
          <MetricLine label="Collected from sales" value={money(data.cashFlow.income, currency)} />
          <MetricLine label="Expenses paid" value={money(data.cashFlow.expenses, currency)} />
          <MetricLine label="Net cash flow" value={money(data.cashFlow.netCashFlow, currency)} bold />
          <MetricLine label="Outstanding payments" value={money(data.cashFlow.outstandingPayments, currency)} />
        </div>
      </Section>
    </div>
  );
}

type ReportProps = {
  data: BusinessReports;
  currency: string;
};

function BreakdownTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: { name: string; quantity: number; revenue: number }[];
  currency: string;
}) {
  return (
    <Section title={title}>
      {rows.length === 0 ? <EmptyRows /> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell>{row.name}</TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell className="text-right">{money(row.revenue, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}

function AmountTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: { name: string; count: number; amount: number }[];
  currency: string;
}) {
  return (
    <Section title={title}>
      {rows.length === 0 ? <EmptyRows /> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell>{row.name}</TableCell>
                <TableCell className="text-right">{row.count}</TableCell>
                <TableCell className="text-right">{money(row.amount, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}

function CustomerTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: BusinessReports["customers"]["topCustomers"];
  currency: string;
}) {
  return (
    <Section title={title}>
      {rows.length === 0 ? <EmptyRows /> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.phone ?? "—"}</TableCell>
                <TableCell className="text-right">{row.orderCount}</TableCell>
                <TableCell className="text-right">{money(row.revenue, currency)}</TableCell>
                <TableCell className="text-right">{money(row.outstanding, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}

function MetricLine({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", bold && "border-t border-gray-100 pt-3 font-semibold")}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-muted/30" />
    </div>
  );
}
