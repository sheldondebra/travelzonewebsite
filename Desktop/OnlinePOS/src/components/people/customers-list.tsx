"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowUpDown,
  Crown,
  LogIn,
  Plus,
  Search,
  Sparkles,
  Upload,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CustomerCard,
  CustomerCardSkeleton,
  CustomerListRow,
  CustomerListRowSkeleton,
  TopBuyerChip,
} from "@/components/people/customer-card";
import { EmptyState } from "@/components/layout/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseApiResponse } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE, type Paginated } from "@/lib/pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

type CustomerStats = {
  total: number;
  withPhone: number;
  withLogin: number;
  active90: number;
  newThisMonth: number;
  repeatBuyers: number;
  noOrders: number;
  topBuyers: {
    id: string;
    name: string;
    phone: string | null;
    orderCount: number;
    totalSpending: number;
  }[];
};

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tags: string[];
  userId: string | null;
  user?: { id: string; email: string } | null;
  _count?: { orders: number };
  totalSpending?: number;
  lastOrderAt?: string | null;
};

type Segment =
  | "all"
  | "active"
  | "repeat"
  | "new"
  | "portal"
  | "walkin"
  | "phone"
  | "no_orders";

type SortKey = "name" | "orders" | "recent" | "spending";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name A–Z" },
  { value: "spending", label: "Top spenders" },
  { value: "orders", label: "Most orders" },
  { value: "recent", label: "Recently active" },
];

function StatMetric({
  label,
  value,
  icon: Icon,
  onClick,
  active,
  tone,
  iconTone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
  tone: string;
  iconTone: string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex flex-col rounded-2xl border p-3.5 text-left shadow-sm transition-all touch-manipulation",
        "border-primary/10 bg-gradient-to-br",
        tone,
        onClick && "active:scale-[0.98]",
        active && "ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide opacity-85">
          {label}
        </span>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-xl shadow-sm",
            iconTone,
          )}
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
    </Comp>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 snap-start rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all touch-manipulation",
        active
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "bg-white text-muted-foreground ring-1 ring-primary/15 active:bg-brand-rose/30",
      )}
    >
      {label}
      <span
        className={cn(
          "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
          active ? "bg-white/25" : "bg-primary/10 text-primary",
        )}
      >
        {count}
      </span>
    </button>
  );
}

export function CustomersList({
  title,
  description,
  hasLogin,
  emptyMessage,
}: {
  title: string;
  description: string;
  hasLogin?: boolean;
  emptyMessage?: string;
}) {
  const { formatMoney, businessName } = useBusinessSettings();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [page, setPage] = useState(1);

  const effectiveSegment = useMemo((): Segment => {
    if (hasLogin === true) return "portal";
    if (hasLogin === false) return "walkin";
    return segment;
  }, [hasLogin, segment]);

  useEffect(() => {
    setPage(1);
  }, [search, effectiveSegment, sort]);

  const params = new URLSearchParams();
  params.set("segment", effectiveSegment);
  params.set("sort", sort);
  if (search.trim()) params.set("search", search.trim());
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  const queryString = `?${params}`;

  const queryKey = ["customers", effectiveSegment, sort, search.trim(), page];

  const { data: stats } = useQuery({
    queryKey: ["customers-stats"],
    queryFn: async () => {
      const res = await fetch("/api/customers/stats");
      return parseApiResponse<CustomerStats>(res);
    },
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/customers${queryString}`);
      return parseApiResponse<
        Paginated<CustomerRow> & { meta: { withPhone: number; withLogin: number } }
      >(res);
    },
  });

  const customers = data?.items ?? [];
  const totalCount = data?.total ?? 0;

  const filterCounts = useMemo(
    () => ({
      all: stats?.total ?? 0,
      active: stats?.active90 ?? 0,
      repeat: stats?.repeatBuyers ?? 0,
      new: stats?.newThisMonth ?? 0,
      portal: stats?.withLogin ?? 0,
      walkin: Math.max(0, (stats?.total ?? 0) - (stats?.withLogin ?? 0)),
      phone: stats?.withPhone ?? 0,
      no_orders: stats?.noOrders ?? 0,
    }),
    [stats],
  );

  const segmentOptions = useMemo(() => {
    if (hasLogin !== undefined) return [];
    return [
      { value: "all" as const, label: "All" },
      { value: "active" as const, label: "Active" },
      { value: "repeat" as const, label: "VIP" },
      { value: "new" as const, label: "New" },
      { value: "portal" as const, label: "Portal" },
      { value: "walkin" as const, label: "Walk-in" },
      { value: "phone" as const, label: "Phone" },
      { value: "no_orders" as const, label: "No orders" },
    ];
  }, [hasLogin]);

  const topBuyerIds = useMemo(
    () => new Set(stats?.topBuyers.map((b) => b.id) ?? []),
    [stats],
  );

  const topBuyersForStrip = useMemo(() => {
    if (!stats?.topBuyers.length) return [];
    return stats.topBuyers.map((b) => ({
      id: b.id,
      name: b.name,
      phone: b.phone,
      email: null,
      tags: [],
      userId: null,
      _count: { orders: b.orderCount },
      totalSpending: b.totalSpending,
      lastOrderAt: null,
    }));
  }, [stats]);

  function openDetail(id: string) {
    router.push(`/dashboard/people/customers/${id}`);
  }

  function getHighlight(c: CustomerRow): "top" | "active" | null {
    if (topBuyerIds.has(c.id)) return "top";
    if (
      c.lastOrderAt &&
      Date.now() - new Date(c.lastOrderAt).getTime() < 90 * 86400000
    ) {
      return "active";
    }
    return null;
  }

  const activeSegmentLabel =
    segmentOptions.find((o) => o.value === effectiveSegment)?.label ?? title;

  function clearFilters() {
    setSearch("");
    setSegment("all");
    setSort("name");
  }

  const summaryLine = stats
    ? `${stats.total} total · ${stats.active90} active`
    : description;

  return (
    <PageShell
      size="wide"
      className={cn(
        "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8",
        "max-lg:-mt-1 max-lg:space-y-4",
      )}
    >
      {/* App-style header */}
      <header className="max-lg:sticky max-lg:top-0 max-lg:z-30 max-lg:-mx-[var(--page-px,0)] max-lg:border-b max-lg:border-primary/10 max-lg:bg-gradient-to-b max-lg:from-brand-cream/95 max-lg:to-white/95 max-lg:px-4 max-lg:pb-3 max-lg:pt-1 max-lg:backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground lg:text-2xl">
              {title}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground lg:text-sm">
              {summaryLine}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/dashboard/people/customers/import"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-10 rounded-full bg-white shadow-sm ring-1 ring-border/80 lg:hidden",
              )}
              aria-label="Import customers"
            >
              <Upload className="size-4" />
            </Link>
            <Link
              href="/dashboard/people/customers/new"
              className={cn(
                buttonVariants({ size: "icon" }),
                "size-10 rounded-full shadow-sm lg:hidden",
              )}
              aria-label="New customer"
            >
              <Plus className="size-4" />
            </Link>
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/dashboard/people/customers/import"
                className={buttonVariants({
                  variant: "outline",
                  className: "h-10 gap-2 rounded-xl px-4",
                })}
              >
                <Upload className="size-4" />
                Import
              </Link>
              <Link
                href="/dashboard/people/customers/new"
                className={buttonVariants({
                  className: "h-10 gap-2 rounded-xl px-4 font-medium",
                })}
              >
                <UserPlus className="size-4" />
                New customer
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics — 2×2 mobile, 4 col desktop */}
      {stats && (
        <section className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4">
          <StatMetric
            label="Total"
            value={String(stats.total)}
            icon={Users}
            tone="from-primary/35 to-brand-rose/25 text-foreground"
            iconTone="bg-primary text-primary-foreground"
            onClick={hasLogin === undefined ? () => setSegment("all") : undefined}
            active={effectiveSegment === "all"}
          />
          <StatMetric
            label="Active"
            value={String(stats.active90)}
            icon={Sparkles}
            tone="from-emerald-500/25 to-emerald-500/5 text-emerald-950"
            iconTone="bg-emerald-500 text-white"
            onClick={hasLogin === undefined ? () => setSegment("active") : undefined}
            active={effectiveSegment === "active"}
          />
          <StatMetric
            label="VIP"
            value={String(stats.repeatBuyers)}
            icon={Crown}
            tone="from-amber-500/25 to-amber-500/5 text-amber-950"
            iconTone="bg-amber-500 text-white"
            onClick={hasLogin === undefined ? () => setSegment("repeat") : undefined}
            active={effectiveSegment === "repeat"}
          />
          <StatMetric
            label="Portal"
            value={String(stats.withLogin)}
            icon={LogIn}
            tone="from-violet-500/25 to-violet-500/5 text-violet-950"
            iconTone="bg-violet-500 text-white"
            onClick={hasLogin === undefined ? () => setSegment("portal") : undefined}
            active={effectiveSegment === "portal"}
          />
        </section>
      )}

      {/* Top buyers — horizontal on phone/tablet */}
      {topBuyersForStrip.length > 0 && hasLogin === undefined && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-[13px] font-semibold text-foreground">Top spenders</h2>
            <button
              type="button"
              onClick={() => {
                setSegment("repeat");
                setSort("spending");
              }}
              className="text-[12px] font-medium text-primary"
            >
              See VIP list
            </button>
          </div>
          <div
            className={cn(
              "flex gap-2 overflow-x-auto pb-0.5 hide-scrollbar snap-x snap-mandatory",
              "max-lg:-mx-4 max-lg:px-4",
              "lg:grid lg:grid-cols-5 lg:gap-3 lg:overflow-visible lg:pb-0",
            )}
          >
            {topBuyersForStrip.map((c, i) => (
              <TopBuyerChip
                key={c.id}
                customer={c}
                rank={i + 1}
                formatMoney={formatMoney}
                onOpen={() => openDetail(c.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Search & filters */}
      <div
        className={cn(
          "space-y-2.5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-border/80",
          "max-lg:sticky max-lg:top-[calc(3.25rem+env(safe-area-inset-top,0px))] max-lg:z-20",
          "lg:p-4",
        )}
      >
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 rounded-xl border-0 bg-muted/40 pl-9 pr-9 text-[15px] shadow-none ring-1 ring-border/60 focus-visible:bg-white focus-visible:ring-primary/30"
              placeholder="Search customers"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground active:bg-muted"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <label className="relative shrink-0">
            <span className="sr-only">Sort</span>
            <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 appearance-none rounded-xl bg-muted/40 py-0 pl-8 pr-7 text-[13px] font-medium ring-1 ring-border/60 focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {segmentOptions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
            {segmentOptions.map(({ value, label }) => (
              <FilterChip
                key={value}
                label={label}
                count={filterCounts[value] ?? 0}
                active={segment === value}
                onClick={() => setSegment(value)}
              />
            ))}
          </div>
        )}
      </div>

      {/* List / grid */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[13px] font-semibold text-foreground">
            {effectiveSegment === "all" ? "Directory" : activeSegmentLabel}
          </h2>
          <span className="text-[12px] tabular-nums text-muted-foreground">
            {isLoading ? "…" : totalCount}
          </span>
        </div>

        {isLoading ? (
          <>
            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-border/80 lg:hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-b border-border/60 last:border-0">
                  <CustomerListRowSkeleton />
                </div>
              ))}
            </div>
            <div className="hidden gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CustomerCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : isError ? (
          <div className="rounded-2xl bg-white px-4 py-12 ring-1 ring-border/80">
            <EmptyState
              title="Could not load customers"
              message={error instanceof Error ? error.message : "Try refreshing."}
            />
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-12 ring-1 ring-border/80">
            <EmptyState
              icon={User}
              title={emptyMessage ?? "No customers yet"}
              message={
                search || effectiveSegment !== "all"
                  ? "Try another search or filter."
                  : "Add your first customer to get started."
              }
              action={
                search || effectiveSegment !== "all" ? (
                  <Button variant="outline" className="rounded-xl" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Link
                    href="/dashboard/people/customers/new"
                    className={buttonVariants({ className: "rounded-xl" })}
                  >
                    Add customer
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <>
            {/* Mobile + tablet: grouped list */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border/80 lg:hidden">
              <ul className="divide-y divide-border/60">
                {customers.map((c) => (
                  <li key={c.id}>
                    <CustomerListRow
                      customer={c}
                      formatMoney={formatMoney}
                      businessName={businessName}
                      onOpen={() => openDetail(c.id)}
                      highlight={getHighlight(c)}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop: card grid */}
            <div className="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {customers.map((c) => (
                <CustomerCard
                  key={c.id}
                  customer={c}
                  formatMoney={formatMoney}
                  businessName={businessName}
                  onOpen={() => openDetail(c.id)}
                  highlight={getHighlight(c)}
                />
              ))}
            </div>
          </>
        )}

        {!isLoading && customers.length > 0 && (
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={totalCount}
            onPageChange={setPage}
            itemName="customers"
            className="rounded-2xl bg-white ring-1 ring-border/80"
          />
        )}
      </section>

      {/* Mobile FAB */}
      <div className="fixed inset-x-0 bottom-[var(--app-bottom-nav-offset,4.5rem)] z-40 px-4 lg:hidden">
        <Link
          href="/dashboard/people/customers/new"
          className={buttonVariants({
            className:
              "h-12 w-full rounded-2xl bg-primary text-[15px] font-semibold shadow-lg shadow-primary/30",
          })}
        >
          <UserPlus className="mr-2 size-5" />
          New customer
        </Link>
      </div>
    </PageShell>
  );
}
