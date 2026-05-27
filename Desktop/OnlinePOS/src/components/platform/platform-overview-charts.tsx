"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, Crown, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlatformOverviewAnalytics = {
  totals: {
    businesses: number;
    users: number;
    paidBusinesses: number;
    paidPlanTotal: number;
    orders: number;
    orderRevenue: number;
    billingRevenue: number;
    billingPayments: number;
    smsRevenue: number;
    smsPurchases: number;
    platformRevenue: number;
  };
  growthTrend: { label: string; businesses: number; users: number }[];
  revenueTrend: { label: string; revenue: number }[];
  planBreakdown: { plan: string; label: string; count: number; color: string }[];
  paidPlans: { plan: string; label: string; count: number; color: string }[];
};

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(248,187,208,0.35)",
  boxShadow: "0 8px 24px -4px rgba(0,0,0,0.08)",
  fontSize: 13,
};

function ChartCard({
  title,
  description,
  icon: Icon,
  iconClass,
  children,
}: {
  title: string;
  description: string;
  icon: typeof TrendingUp;
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
      <div className="flex items-start gap-3 border-b border-primary/10 bg-gradient-to-r from-brand-cream/40 to-brand-rose/15 px-4 py-4 sm:px-5">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            iconClass,
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function PlatformOverviewCharts({
  analytics,
}: {
  analytics: PlatformOverviewAnalytics;
}) {
  const plans = analytics.planBreakdown.filter((p) => p.count > 0);
  const paidOnly = analytics.paidPlans.filter((p) => p.count > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Business growth"
          description="New stores registered — last 30 days"
          icon={Building2}
          iconClass="bg-violet-500/15 text-violet-800"
        >
          <div className="h-56 min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.growthTrend}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="businesses"
                  name="New businesses"
                  fill="#8B5CF6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="User signups"
          description="New accounts on the platform — last 30 days"
          icon={Users}
          iconClass="bg-sky-500/15 text-sky-800"
        >
          <div className="h-56 min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics.growthTrend}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="New users"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#usersFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Paid plans"
          description="Businesses on paid subscription tiers"
          icon={Crown}
          iconClass="bg-amber-500/15 text-amber-900"
        >
          {paidOnly.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No paid plans yet
            </p>
          ) : (
            <div className="h-56 min-h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paidOnly}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {paidOnly.map((entry) => (
                      <Cell key={entry.plan} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="All plans"
          description="Full subscription mix across tenants"
          icon={Building2}
          iconClass="bg-emerald-500/15 text-emerald-800"
        >
          {plans.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No businesses yet</p>
          ) : (
            <div className="h-56 min-h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={plans}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={88}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} businesses`, "Count"]} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={24}>
                    {plans.map((entry) => (
                      <Cell key={entry.plan} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Platform revenue"
        description="Order volume + SMS credit sales — last 30 days (GHS)"
        icon={TrendingUp}
        iconClass="bg-primary/15 text-primary"
      >
        <div className="h-56 min-h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={analytics.revenueTrend}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F8BBD0" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#F8BBD0" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₵${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`GHS ${Number(v).toLocaleString()}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#E91E8C"
                strokeWidth={2}
                fill="url(#revFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
