"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { CreateOrderDialog } from "@/components/dashboard/create-order-dialog";
import {
  OrderCard,
  OrderCardSkeleton,
} from "@/components/dashboard/orders/order-card";
import { OrdersStatsCharts } from "@/components/dashboard/orders-stats-charts";
import { EmptyState } from "@/components/layout/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/table-pagination";
import { parseApiResponse } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { formatPaymentStatus } from "@/lib/orders/format";
import { cn } from "@/lib/utils";
import { PAYMENT_STATUSES } from "@/server/validations/order";

type Order = {
  id: string;
  reference: string | null;
  totalAmount: number;
  profit: number;
  paymentStatus: string;
  deliveryStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  customer: { name: string };
  items: { quantity: number; product: { name: string } }[];
};

type OrdersPage = {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type OrderStats = {
  total: number;
  totalRevenue: number;
  totalProfit: number;
  pending: number;
  paid: number;
  paymentBreakdown: { status: string; count: number }[];
  ordersByDay: { label: string; orders: number; revenue: number }[];
};

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

export function OrdersManager() {
  const router = useRouter();
  const { formatMoney } = useBusinessSettings();
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, paymentFilter]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["orders", search, paymentFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (paymentFilter !== "all") params.set("paymentStatus", paymentFilter);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const res = await fetch(`/api/orders?${params}`);
      return parseApiResponse<OrdersPage>(res);
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["orders-stats"],
    queryFn: async () => {
      const res = await fetch("/api/orders/stats");
      return parseApiResponse<OrderStats>(res);
    },
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;

  const filterCounts = useMemo(() => {
    const breakdown = new Map(
      stats?.paymentBreakdown.map((b) => [b.status, b.count]) ?? [],
    );
    return {
      all: stats?.total ?? 0,
      ...Object.fromEntries(
        PAYMENT_STATUSES.map((s) => [s, breakdown.get(s) ?? 0]),
      ),
    } as Record<string, number>;
  }, [stats]);

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      ...PAYMENT_STATUSES.map((s) => ({
        value: s,
        label: formatPaymentStatus(s),
      })),
    ],
    [],
  );

  const statTiles = useMemo(
    () =>
      stats
        ? [
            {
              label: "Total orders",
              value: String(stats.total),
              sub: `${formatMoney(stats.totalRevenue)} revenue`,
              icon: ShoppingBag,
              className: "from-primary/30 to-brand-rose/20 text-foreground",
              iconBg: "bg-primary text-primary-foreground shadow-sm",
            },
            {
              label: "Revenue",
              value: formatMoney(stats.totalRevenue),
              sub: "All time",
              icon: Wallet,
              className: "from-violet-500/20 to-violet-500/5 text-violet-900",
              iconBg: "bg-violet-500/15 text-violet-800",
            },
            {
              label: "Paid",
              value: String(stats.paid),
              sub: `${stats.pending} pending`,
              icon: TrendingUp,
              className: "from-emerald-500/20 to-emerald-500/5 text-emerald-900",
              iconBg: "bg-emerald-500/15 text-emerald-700",
            },
            {
              label: "Profit",
              value: formatMoney(stats.totalProfit),
              sub: "After costs",
              icon: Package,
              className: "from-sky-500/20 to-sky-500/5 text-sky-900",
              iconBg: "bg-sky-500/15 text-sky-700",
            },
          ]
        : [],
    [stats, formatMoney],
  );

  function openOrder(id: string) {
    router.push(`/dashboard/orders/${id}`);
  }

  const activeFilterLabel =
    filterOptions.find((o) => o.value === paymentFilter)?.label ?? "All";

  return (
    <PageShell size="wide" className="pb-28 lg:pb-8">
      {/* Hero header */}
      <header className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/35 via-brand-rose/45 to-brand-cream px-4 py-5 shadow-soft sm:px-6 sm:py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/25 blur-2xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-sm sm:size-14">
              <Receipt className="size-6 text-primary-foreground sm:size-7" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                Sales & fulfillment
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Orders</h1>
              <p className="mt-0.5 max-w-md text-sm text-foreground/70">
                {stats
                  ? `${stats.total} orders · ${formatMoney(stats.totalRevenue)} revenue`
                  : "Track payments, delivery, and receipts"}
              </p>
            </div>
          </div>
          <Button
            className="hidden h-11 shrink-0 rounded-xl px-5 font-semibold shadow-soft sm:inline-flex"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            New order
          </Button>
        </div>
      </header>

      {/* Stats */}
      {statTiles.length > 0 && (
        <section className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {statTiles.map(({ label, value, sub, icon: Icon, className, iconBg }) => (
            <div
              key={label}
              className={cn(
                "flex min-w-[10.5rem] shrink-0 flex-1 flex-col gap-3 rounded-2xl border border-primary/10 bg-gradient-to-br p-4 shadow-card sm:min-w-0",
                className,
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    iconBg,
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                    {label}
                  </p>
                  <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">
                    {value}
                  </p>
                </div>
              </div>
              {sub && (
                <p className="text-xs font-medium opacity-70">{sub}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Search + filters */}
      <div className="sticky top-0 z-20 space-y-3 rounded-2xl border border-primary/10 bg-white/90 p-3 backdrop-blur-md sm:static sm:border-primary/10 sm:bg-white sm:p-4 sm:shadow-card sm:backdrop-blur-none">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-xl border-primary/10 bg-brand-cream/20 pl-10 pr-10 shadow-none focus-visible:border-primary/30 focus-visible:bg-white"
            placeholder="Search customer, reference, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-brand-rose/40"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterOptions.map((opt) => {
            const active = paymentFilter === opt.value;
            const count = filterCounts[opt.value] ?? 0;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPaymentFilter(opt.value)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all touch-manipulation",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft ring-2 ring-primary/30"
                    : "border border-primary/15 bg-white text-muted-foreground hover:border-primary/30 hover:bg-brand-rose/30 hover:text-foreground",
                )}
              >
                {opt.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Order list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <h2 className="text-sm font-semibold text-foreground">
            {paymentFilter === "all" ? "All orders" : activeFilterLabel}
          </h2>
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${total} ${total === 1 ? "order" : "orders"}`}
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 px-4 py-10">
            <EmptyState
              title="Could not load orders"
              message={error instanceof Error ? error.message : "Try refreshing the page."}
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary/20 bg-brand-cream/30 px-4 py-10">
            <EmptyState
              icon={Sparkles}
              title="No orders found"
              message={
                search || paymentFilter !== "all"
                  ? "Try adjusting your search or payment filter."
                  : "Create your first order to start tracking sales."
              }
              action={
                search || paymentFilter !== "all" ? (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setSearch("");
                      setPaymentFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button className="rounded-xl" onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 size-4" />
                    New order
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                formatMoney={formatMoney}
                onOpen={() => openOrder(order.id)}
              />
            ))}
          </div>
        )}

        {!isLoading && orders.length > 0 && (
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            itemName="orders"
            className="rounded-2xl border border-primary/10 bg-white/80"
          />
        )}
      </section>

      {/* Analytics */}
      {stats && stats.total > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-sm font-semibold text-foreground">Analytics</h2>
            <span className="text-xs text-muted-foreground">Last 14 days</span>
          </div>
          <OrdersStatsCharts stats={stats} />
        </section>
      )}

      {/* Mobile FAB */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/15 bg-gradient-to-t from-white via-white/95 to-white/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] lg:hidden">
        <Button
          className="h-12 w-full rounded-2xl text-base font-semibold shadow-soft"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-2 size-5" />
          New order
        </Button>
      </div>

      <CreateOrderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(orderId) => router.push(`/dashboard/orders/${orderId}`)}
      />
    </PageShell>
  );
}
