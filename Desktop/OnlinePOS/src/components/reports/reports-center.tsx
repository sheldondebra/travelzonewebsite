"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  ChevronRight,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { BusinessReports } from "@/server/services/reports/get-business-reports";
import {
  REPORT_CENTER_SUMMARY,
  REPORT_DEFINITIONS,
} from "@/components/reports/report-definitions";

function money(n: number, currency: string) {
  const sym = currency === "GHS" ? "₵" : `${currency} `;
  return `${sym}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function ReportsCenter() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-center-summary"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      return parseApiResponse<BusinessReports>(res);
    },
  });

  const cur = data?.currency ?? "GHS";
  const SummaryIcon = REPORT_CENTER_SUMMARY.icon;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-brand-cream via-white to-brand-rose/40 p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                REPORT_CENTER_SUMMARY.accent,
              )}
            >
              <SummaryIcon className="size-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Business intelligence
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Reports Center
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Open detailed reports for sales, delivery, stock, purchases,
                products, customers, expenses, profit and cash flow.
              </p>
            </div>
          </div>
          {isLoading ? (
            <Badge variant="secondary" className="w-fit gap-2 rounded-full px-3 py-1">
              <Loader2 className="size-3 animate-spin" />
              Loading summary
            </Badge>
          ) : data ? (
            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
              <SummaryPill label="Revenue" value={money(data.sales.revenue, cur)} />
              <SummaryPill label="Orders" value={String(data.sales.orderCount)} />
              <SummaryPill label="Deliveries" value={String(data.delivery.totalOrders)} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MiniStat
          label="Net profit"
          value={data ? money(data.profitAndLoss.netProfit, cur) : "—"}
          icon={BarChart3}
        />
        <MiniStat
          label="Collected"
          value={data ? money(data.cashFlow.income, cur) : "—"}
          icon={Calendar}
        />
        <MiniStat
          label="Stock units"
          value={data ? data.stock.totalUnits.toLocaleString() : "—"}
          icon={FileText}
        />
        <MiniStat
          label="Customers"
          value={data ? String(data.customers.totalCustomers) : "—"}
          icon={REPORT_DEFINITIONS.find((r) => r.id === "customers")!.icon}
        />
        <MiniStat
          label="Products sold"
          value={data ? String(data.products.soldProducts) : "—"}
          icon={REPORT_DEFINITIONS.find((r) => r.id === "products")!.icon}
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">All report types</h2>
            <p className="text-sm text-muted-foreground">
              Choose a report to view full details.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {REPORT_DEFINITIONS.map((report) => {
            const Icon = report.icon;
            return (
              <Link
                key={report.id}
                href={`/dashboard/reports/${report.id}`}
                className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                      report.accent,
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <ChevronRight className="mt-2 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{report.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {report.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white/80 px-3 py-2 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof FileText;
}) {
  return (
    <Card className="border-gray-100 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
      </CardHeader>
      <CardContent>
        <CardTitle className="truncate text-xl tabular-nums">{value}</CardTitle>
      </CardContent>
    </Card>
  );
}
