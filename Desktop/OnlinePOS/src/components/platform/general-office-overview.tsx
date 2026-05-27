"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import {
  Building2,
  Crown,
  LayoutDashboard,
  MessageSquare,
  CreditCard,
  Shield,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import {
  PlatformOverviewCharts,
  type PlatformOverviewAnalytics,
} from "@/components/platform/platform-overview-charts";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  isVerified: boolean;
  subscriptionPlan: string;
  createdAt: string;
  _count: { orders: number; products: number; users: number };
};

type PlatformData = {
  businesses: BusinessRow[];
  analytics: PlatformOverviewAnalytics;
  platformStats: {
    totalBusinesses: number;
    totalUsers: number;
    totalOrders: number;
    platformRevenue: number;
    billingRevenue: number;
    paidBusinesses: number;
    orderRevenue: number;
    smsRevenue: number;
  };
};

const MAIN_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "businesses", label: "Businesses", icon: Building2 },
] as const;

type MainTabId = (typeof MAIN_TABS)[number]["id"];

const QUICK_LINKS = [
  {
    href: "/dashboard/platform/billing",
    label: "Billing",
    description: "Plans, coupons, providers & payments",
    icon: CreditCard,
    tone: "from-emerald-500/20 to-emerald-500/5 border-emerald-200/60",
    iconTone: "bg-emerald-500/20 text-emerald-900",
  },
  {
    href: "/dashboard/platform/users",
    label: "Users",
    description: "Manage accounts, roles & access",
    icon: Users,
    tone: "from-amber-500/20 to-amber-500/5 border-amber-200/60",
    iconTone: "bg-amber-500/20 text-amber-900",
  },
  {
    href: "/dashboard/platform/sms",
    label: "SMS control",
    description: "Credits, delivery & provider",
    icon: Smartphone,
    tone: "from-violet-500/20 to-violet-500/5 border-violet-200/60",
    iconTone: "bg-violet-500/20 text-violet-800",
  },
  {
    href: "/dashboard/platform/communications",
    label: "Communications",
    description: "Email & tenant messaging",
    icon: MessageSquare,
    tone: "from-sky-500/20 to-sky-500/5 border-sky-200/60",
    iconTone: "bg-sky-500/15 text-sky-800",
  },
];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  className: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/10 bg-gradient-to-br p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs opacity-70">{sub}</p>}
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/55">
          <Icon className="size-5 opacity-90" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

function TabBar({
  active,
  onChange,
}: {
  active: MainTabId;
  onChange: (id: MainTabId) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-primary/10 bg-white p-1 shadow-sm">
      {MAIN_TABS.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors touch-manipulation",
              active === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-brand-rose/30",
            )}
          >
            <Icon className="size-4" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

const PLAN_BADGE: Record<string, string> = {
  FREE: "bg-slate-100 text-slate-700",
  PRO: "bg-violet-100 text-violet-800",
  BUSINESS: "bg-blue-100 text-blue-800",
  ENTERPRISE: "bg-amber-100 text-amber-900",
};

export function GeneralOfficeOverview() {
  const [tab, setTab] = useState<MainTabId>("overview");

  const { data, isLoading, error } = useQuery({
    queryKey: ["platform-admin"],
    queryFn: async () => {
      const res = await fetch("/api/platform/admin");
      return parseApiResponse<PlatformData>(res);
    },
  });

  const {
    page,
    setPage,
    items: businesses,
    total,
    pageSize,
  } = useClientPagination(data?.businesses ?? [], undefined, [tab]);

  if (isLoading) {
    return (
      <PageShell size="wide">
        <p className="text-sm text-muted-foreground">Loading General Office overview…</p>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell size="wide">
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : "Access denied"}
        </p>
      </PageShell>
    );
  }

  if (!data) return null;

  const { analytics, platformStats: stats } = data;
  const paidRate =
    stats.totalBusinesses > 0
      ? Math.round((stats.paidBusinesses / stats.totalBusinesses) * 100)
      : 0;

  return (
    <PageShell size="wide" className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-brand-rose/30 text-primary">
              <Shield className="size-6" strokeWidth={1.75} />
            </span>
            General Office
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Platform overview — businesses, users, paid plans, and revenue across
            all tenants
          </p>
        </div>
        <Badge className="w-fit rounded-full bg-primary/15 px-3 py-1 text-primary">
          Tecunit platform admin
        </Badge>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Businesses"
          value={stats.totalBusinesses}
          sub="Active tenants"
          icon={Building2}
          className="text-violet-950 from-violet-500/25 to-violet-500/5"
        />
        <StatCard
          label="Users"
          value={stats.totalUsers.toLocaleString()}
          sub="All store accounts"
          icon={Users}
          className="text-sky-950 from-sky-500/25 to-sky-500/5"
        />
        <StatCard
          label="Paid plans"
          value={stats.paidBusinesses}
          sub={`${paidRate}% of tenants`}
          icon={Crown}
          className="text-amber-950 from-amber-500/25 to-amber-500/5"
        />
        <StatCard
          label="Orders"
          value={stats.totalOrders.toLocaleString()}
          sub={`GHS ${stats.orderRevenue.toLocaleString()} sales`}
          icon={ShoppingBag}
          className="text-emerald-950 from-emerald-500/25 to-emerald-500/5"
        />
        <StatCard
          label="Platform revenue"
          value={`GHS ${stats.platformRevenue.toLocaleString()}`}
          sub={`Billing GHS ${stats.billingRevenue.toLocaleString()} · SMS GHS ${stats.smsRevenue.toLocaleString()}`}
          icon={Wallet}
          className="text-rose-950 from-primary/25 to-brand-rose/10"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-4 rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-all hover:shadow-md touch-manipulation",
                link.tone,
              )}
            >
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                  link.iconTone,
                )}
              >
                <Icon className="size-6" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-semibold">{link.label}</p>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="New businesses (30d)"
              value={analytics.growthTrend.reduce((s, d) => s + d.businesses, 0)}
              icon={TrendingUp}
              className="text-violet-950 from-violet-500/15 to-white"
            />
            <StatCard
              label="New users (30d)"
              value={analytics.growthTrend.reduce((s, d) => s + d.users, 0)}
              icon={Users}
              className="text-sky-950 from-sky-500/15 to-white"
            />
            <StatCard
              label="Paid tier total"
              value={analytics.totals.paidPlanTotal}
              icon={Crown}
              className="text-amber-950 from-amber-500/15 to-white"
            />
            <StatCard
              label="SMS purchases"
              value={analytics.totals.smsPurchases}
              sub={`GHS ${analytics.totals.smsRevenue.toLocaleString()}`}
              icon={Smartphone}
              className="text-emerald-950 from-emerald-500/15 to-white"
            />
          </div>
          <PlatformOverviewCharts analytics={analytics} />
        </div>
      )}

      {tab === "businesses" && (
        <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
          <div className="border-b border-primary/10 bg-gradient-to-r from-brand-cream/50 to-brand-rose/15 px-4 py-4 sm:px-5">
            <h2 className="font-semibold">All businesses</h2>
            <p className="text-sm text-muted-foreground">
              Manage and monitor every store on the platform
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Store</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No businesses registered yet
                    </TableCell>
                  </TableRow>
                ) : (
                  businesses.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <p className="font-medium">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.slug}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-full capitalize",
                            PLAN_BADGE[b.subscriptionPlan] ?? "bg-muted",
                          )}
                        >
                          {b.subscriptionPlan.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{b._count.users}</TableCell>
                      <TableCell className="tabular-nums">{b._count.orders}</TableCell>
                      <TableCell className="tabular-nums">{b._count.products}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(b.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {b.isPublic ? (
                          <Link
                            href={`/store/${b.slug}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
                            target="_blank"
                          >
                            View
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            itemName="businesses"
          />
        </section>
      )}
    </PageShell>
  );
}
