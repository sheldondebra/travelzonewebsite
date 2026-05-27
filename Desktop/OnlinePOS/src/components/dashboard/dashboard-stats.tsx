"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  Package,
  PackagePlus,
  ScanLine,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { EmptyState } from "@/components/layout/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { useClientPagination } from "@/hooks/use-client-pagination";

type DashboardData = {
  currency: string;
  revenue: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  orderCount: number;
  productCount: number;
  customerCount: number;
  today: { revenue: number; profit: number; orders: number };
  week: { revenue: number };
  month: { revenue: number; expenses: number };
  lowStock: {
    id: string;
    name: string;
    stockQuantity: number;
    sku: string | null;
  }[];
  outOfStock: number;
  bestSellers: { name: string; quantity: number }[];
  pendingDeliveries: number;
  unreadNotifications: number;
};

function fmt(amount: number, currency: string, compact = false) {
  if (compact && amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(1)}k`;
  }
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  iconBg: string;
  featured?: boolean;
}[] = [
  {
    href: "/dashboard/pos",
    label: "Open POS",
    description: "New sale",
    icon: ScanLine,
    tone: "border-primary/25 bg-gradient-to-br from-primary/40 via-brand-rose/50 to-brand-cream",
    iconBg: "bg-primary text-primary-foreground shadow-sm",
    featured: true,
  },
  {
    href: "/dashboard/products/new",
    label: "Add product",
    description: "Catalog",
    icon: PackagePlus,
    tone: "border-violet-200/80 bg-gradient-to-br from-violet-500/10 to-white",
    iconBg: "bg-violet-500/15 text-violet-800",
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    description: "P&L & sales",
    icon: BarChart3,
    tone: "border-sky-200/80 bg-gradient-to-br from-sky-500/10 to-white",
    iconBg: "bg-sky-500/15 text-sky-800",
  },
  {
    href: "/dashboard/people/customers",
    label: "Customers",
    description: "Contacts",
    icon: Users,
    tone: "border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 to-white",
    iconBg: "bg-emerald-500/15 text-emerald-800",
  },
];

export function DashboardStats() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      return parseApiResponse<DashboardData>(res);
    },
  });

  const lowStockPagination = useClientPagination(data?.lowStock ?? []);
  const bestSellersPagination = useClientPagination(data?.bestSellers ?? []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-semibold text-destructive">Could not load overview</p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </PageShell>
    );
  }

  if (!data) return null;

  const cur = data.currency;
  const todayLabel = format(new Date(), "EEEE, MMM d");
  const stockAlerts = data.lowStock.length + data.outOfStock;

  const kpiTiles = [
    {
      label: "Total sales",
      value: fmt(data.revenue, cur, true),
      sub: `${data.orderCount} orders`,
      icon: ShoppingBag,
      className: "from-primary/25 via-brand-rose/30 to-brand-cream/80",
      iconBg: "bg-primary/20 text-foreground",
    },
    {
      label: "Gross profit",
      value: fmt(data.grossProfit, cur, true),
      sub: `${data.profitMargin.toFixed(0)}% margin`,
      icon: TrendingUp,
      className: "from-emerald-500/15 to-emerald-500/5",
      iconBg: "bg-emerald-500/15 text-emerald-800",
    },
    {
      label: "Products",
      value: String(data.productCount),
      sub: `${data.customerCount} customers`,
      icon: Boxes,
      className: "from-violet-500/12 to-violet-500/5",
      iconBg: "bg-violet-500/15 text-violet-800",
    },
    {
      label: "This month",
      value: fmt(data.month.revenue, cur, true),
      sub:
        data.month.expenses > 0
          ? `${fmt(data.month.expenses, cur, true)} expenses`
          : "Revenue",
      icon: Wallet,
      className: "from-amber-500/12 to-amber-500/5",
      iconBg: "bg-amber-500/15 text-amber-900",
    },
  ];

  const periodTiles = [
    {
      label: "Today",
      value: fmt(data.today.revenue, cur, true),
      meta: `${data.today.orders} orders`,
      icon: Sparkles,
    },
    {
      label: "This week",
      value: fmt(data.week.revenue, cur, true),
      meta: "7 days",
      icon: BarChart3,
    },
    {
      label: "Stock alerts",
      value: String(stockAlerts),
      meta: data.outOfStock > 0 ? `${data.outOfStock} out` : "Low stock",
      icon: AlertTriangle,
      href: "/dashboard/products?stock=low",
      warn: stockAlerts > 0,
    },
  ];

  return (
    <PageShell size="wide" className="space-y-5 sm:space-y-6">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/40 via-brand-rose/50 to-brand-cream px-4 py-5 shadow-soft sm:px-6 sm:py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-primary/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-8 left-1/4 size-32 rounded-full bg-brand-rose/60 blur-2xl"
        />

        <div className="relative space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
                {todayLabel}
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">
                {greeting()}
              </h1>
              <p className="mt-1 text-sm text-foreground/70">
                Here&apos;s how your store is performing.
              </p>
            </div>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-sm sm:size-14">
              <ShoppingBag className="size-6 text-primary-foreground sm:size-7" />
            </span>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/75 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Today&apos;s sales
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
              {fmt(data.today.revenue, cur)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.today.orders} {data.today.orders === 1 ? "order" : "orders"} · Profit{" "}
              {fmt(data.today.profit, cur)}
            </p>
          </div>

          <Link
            href="/dashboard/pos"
            className={cn(
              buttonVariants(),
              "flex h-12 w-full items-center justify-center rounded-2xl text-base font-semibold shadow-soft sm:hidden",
            )}
          >
            <ScanLine className="mr-2 size-5" />
            Start a sale
          </Link>
        </div>
      </header>

      {data.unreadNotifications > 0 && (
        <Link
          href="/dashboard/orders"
          className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-brand-rose/60 to-primary/20 px-4 py-3.5 transition-colors hover:border-primary/35"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/25">
            <Bell className="size-5 text-foreground" />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="font-semibold">{data.unreadNotifications} updates</span>
            <span className="text-muted-foreground"> — tap to view orders</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {/* KPI scroll */}
      <section className="-mx-0.5 flex gap-3 overflow-x-auto px-0.5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {kpiTiles.map(({ label, value, sub, icon: Icon, className, iconBg }) => (
          <div
            key={label}
            className={cn(
              "flex min-w-[10.5rem] shrink-0 flex-1 items-center gap-3 rounded-2xl border border-primary/10 bg-gradient-to-br p-4 shadow-card sm:min-w-0",
              className,
            )}
          >
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                iconBg,
              )}
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-75">
                {label}
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight sm:text-xl">
                {value}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Period row */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {periodTiles.map(({ label, value, meta, icon: Icon, href, warn }) => {
          const inner = (
            <div
              className={cn(
                "flex h-full flex-col rounded-2xl border p-3 transition-all sm:p-4",
                warn
                  ? "border-amber-300/60 bg-gradient-to-br from-amber-50 to-white"
                  : "border-primary/10 bg-white/90 shadow-card hover:border-primary/25",
                href && "hover:shadow-soft",
              )}
            >
              <Icon
                className={cn(
                  "mb-2 size-4",
                  warn ? "text-amber-600" : "text-primary",
                )}
              />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums sm:text-lg">{value}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">{meta}</p>
            </div>
          );
          return href ? (
            <Link key={label} href={href} className="touch-manipulation">
              {inner}
            </Link>
          ) : (
            <div key={label}>{inner}</div>
          );
        })}
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-3 flex items-center justify-between px-0.5">
          <h2 className="text-sm font-semibold">Quick actions</h2>
          <Link
            href="/dashboard/orders"
            className="text-xs font-medium text-primary hover:underline"
          >
            All orders
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map(
            ({ href, label, description, icon: Icon, tone, iconBg, featured }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 transition-all touch-manipulation active:scale-[0.98]",
                  tone,
                  featured && "sm:col-span-1",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl",
                    iconBg,
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span>
                  <span className="flex items-center gap-1 font-semibold">
                    {label}
                    <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </span>
              </Link>
            ),
          )}
        </div>
      </section>

      {/* Alerts row */}
      {(data.pendingDeliveries > 0 || data.expenses > 0) && (
        <section className="grid gap-3 sm:grid-cols-2">
          {data.pendingDeliveries > 0 && (
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white p-4 shadow-card transition-colors hover:border-amber-300"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800">
                <Truck className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{data.pendingDeliveries} pending deliveries</p>
                <p className="text-xs text-muted-foreground">Manage orders</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </Link>
          )}
          {data.expenses > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-white/90 p-4 shadow-card">
              <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-800">
                <TrendingUp className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Net position</p>
                <p className="text-lg font-bold tabular-nums">{fmt(data.netProfit, cur)}</p>
              </div>
            </div>
          )}
        </section>
      )}

      <AnalyticsCharts
        revenue={data.revenue}
        profit={data.grossProfit}
        expenses={data.expenses}
        currency={cur}
      />

      {/* Inventory insights */}
      <section className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <InsightPanel
          title="Low stock"
          description="At or below alert level"
          href="/dashboard/products"
          linkLabel="Products"
          emptyMessage="Inventory levels look healthy."
          isEmpty={data.lowStock.length === 0}
        >
          <ul className="space-y-2">
            {lowStockPagination.items.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-primary/10 bg-brand-cream/25 px-3 py-3 sm:px-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Package className="size-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{p.name}</p>
                    {p.sku && (
                      <p className="truncate text-[11px] text-muted-foreground">{p.sku}</p>
                    )}
                  </div>
                </div>
                <StockBadge qty={p.stockQuantity} />
              </li>
            ))}
          </ul>
          {data.lowStock.length > 0 && (
            <TablePagination
              page={lowStockPagination.page}
              pageSize={lowStockPagination.pageSize}
              total={lowStockPagination.total}
              onPageChange={lowStockPagination.setPage}
              itemName="products"
              className="mt-3 border-0 bg-transparent pt-0"
            />
          )}
        </InsightPanel>

        <InsightPanel
          title="Best sellers"
          description="Last 90 days by units"
          href="/dashboard/reports"
          linkLabel="Reports"
          emptyMessage="Sales appear here after your first orders."
          isEmpty={data.bestSellers.length === 0}
        >
          <ul className="space-y-2">
            {bestSellersPagination.items.map((p, i) => {
              const rank =
                (bestSellersPagination.page - 1) * bestSellersPagination.pageSize + i + 1;
              return (
                <li
                  key={p.name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-primary/10 bg-brand-cream/25 px-3 py-3 sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums",
                        rank <= 3
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-white text-muted-foreground shadow-sm",
                      )}
                    >
                      {rank}
                    </span>
                    <p className="truncate font-medium text-sm">{p.name}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold tabular-nums shadow-sm">
                    {p.quantity}
                  </span>
                </li>
              );
            })}
          </ul>
          {data.bestSellers.length > 0 && (
            <TablePagination
              page={bestSellersPagination.page}
              pageSize={bestSellersPagination.pageSize}
              total={bestSellersPagination.total}
              onPageChange={bestSellersPagination.setPage}
              itemName="products"
              className="mt-3 border-0 bg-transparent pt-0"
            />
          )}
        </InsightPanel>
      </section>

      {/* Desktop CTA strip */}
      <div className="hidden items-center justify-between gap-4 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/20 to-brand-rose/30 px-5 py-4 sm:flex">
        <div>
          <p className="font-semibold">Ready for the next sale?</p>
          <p className="text-sm text-muted-foreground">Open POS to checkout in seconds.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/reports" className={buttonVariants({ variant: "outline" })}>
            Reports
          </Link>
          <Link href="/dashboard/pos" className={buttonVariants()}>
            <ScanLine className="mr-2 size-4" />
            Open POS
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function InsightPanel({
  title,
  description,
  href,
  linkLabel,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white/95 shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-primary/10 bg-gradient-to-r from-brand-cream/50 to-brand-rose/20 px-4 py-4 sm:px-5">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 text-xs font-semibold text-primary hover:underline"
        >
          {linkLabel}
        </Link>
      </div>
      <div className="p-4 sm:p-5">
        {isEmpty ? (
          <EmptyState message={emptyMessage} className="py-8" />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function StockBadge({ qty }: { qty: number }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "shrink-0 rounded-full px-2.5 tabular-nums font-semibold",
        qty === 0 && "bg-red-500/15 text-red-800 ring-1 ring-red-500/20",
        qty > 0 && "bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/20",
      )}
    >
      {qty}
    </Badge>
  );
}

function DashboardSkeleton() {
  return (
    <PageShell size="wide" className="space-y-5">
      <div className="h-52 animate-pulse rounded-2xl bg-gradient-to-br from-brand-rose/50 to-primary/20" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 min-w-[10rem] flex-1 animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-muted/35" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-muted/35" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted/35" />
      </div>
    </PageShell>
  );
}
