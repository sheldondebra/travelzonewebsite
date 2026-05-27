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
import {
  BarChart3,
  Coins,
  MessageSquare,
  Send,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PlatformSmsAnalytics = {
  usageTrend: { label: string; sent: number; failed: number }[];
  creditsTrend: { label: string; units: number; revenue: number }[];
  deliveryBreakdown: { status: string; label: string; count: number }[];
  categoryUsage: { category: string; label: string; units: number }[];
  summary: {
    creditsSoldPeriod: number;
    revenuePeriod: number;
    unitsUsedPeriod: number;
    pendingDelivery: number;
    deliveredCount: number;
  };
};

const STATUS_COLORS: Record<string, string> = {
  SENT: "#22C55E",
  DELIVERED: "#10B981",
  FAILED: "#EF4444",
  PENDING: "#F59E0B",
  UNDELIVERED: "#94A3B8",
};

const CATEGORY_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#F8BBD0",
  "#F59E0B",
  "#14B8A6",
  "#EC4899",
  "#6366F1",
  "#84CC16",
];

function ChartShell({
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

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(248,187,208,0.35)",
  boxShadow: "0 8px 24px -4px rgba(0,0,0,0.08)",
  fontSize: 13,
};

export function PlatformSmsOverviewCharts({
  analytics,
}: {
  analytics: PlatformSmsAnalytics;
}) {
  const delivery = analytics.deliveryBreakdown;
  const categories = analytics.categoryUsage;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartShell
          title="SMS usage"
          description="Units sent vs failed — last 14 days"
          icon={TrendingUp}
          iconClass="bg-emerald-500/15 text-emerald-800"
        >
          <div className="h-56 min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics.usageTrend}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="smsSentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="smsFailedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="sent"
                  name="Sent"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fill="url(#smsSentFill)"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  name="Failed"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#smsFailedFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <ChartShell
          title="Credits sold"
          description="SMS units purchased by tenants — last 14 days"
          icon={Wallet}
          iconClass="bg-violet-500/15 text-violet-800"
        >
          <div className="h-56 min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.creditsTrend}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
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
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    name === "revenue" ? `GHS ${Number(value).toFixed(0)}` : `${value} units`,
                    name === "revenue" ? "Revenue" : "Credits",
                  ]}
                />
                <Bar dataKey="units" name="Credits" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartShell
          title="Delivery status"
          description="Message outcomes across the platform"
          icon={Send}
          iconClass="bg-sky-500/15 text-sky-800"
        >
          {delivery.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No SMS logs yet</p>
          ) : (
            <div className="h-56 min-h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={delivery}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {delivery.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? "#F8BBD0"}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartShell>

        <ChartShell
          title="Usage by category"
          description="SMS units consumed per message type"
          icon={BarChart3}
          iconClass="bg-amber-500/15 text-amber-900"
        >
          {categories.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No usage data yet</p>
          ) : (
            <div className="h-56 min-h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categories}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={100}
                    tick={{ fontSize: 10, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${value} units`, "Usage"]}
                  />
                  <Bar dataKey="units" radius={[0, 8, 8, 0]} maxBarSize={24}>
                    {categories.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartShell>
      </div>
    </div>
  );
}

export function PlatformSmsStatCard({
  label,
  value,
  sub,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof MessageSquare;
  className: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/10 p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs opacity-70">{sub}</p>}
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/50">
          <Icon className="size-5 opacity-90" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

export function PlatformSmsPeriodStrip({
  summary,
}: {
  summary: PlatformSmsAnalytics["summary"];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <PlatformSmsStatCard
        label="Units used (14d)"
        value={summary.unitsUsedPeriod.toLocaleString()}
        icon={MessageSquare}
        className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-950"
      />
      <PlatformSmsStatCard
        label="Credits sold (14d)"
        value={summary.creditsSoldPeriod.toLocaleString()}
        icon={Coins}
        className="bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-950"
      />
      <PlatformSmsStatCard
        label="Revenue (14d)"
        value={`GHS ${summary.revenuePeriod.toLocaleString()}`}
        icon={Wallet}
        className="bg-gradient-to-br from-sky-500/20 to-sky-500/5 text-sky-950"
      />
      <PlatformSmsStatCard
        label="In queue"
        value={summary.pendingDelivery}
        sub={`${summary.deliveredCount} delivered (all time)`}
        icon={Send}
        className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-950"
      />
    </div>
  );
}
