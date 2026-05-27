"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { formatPaymentStatus } from "@/lib/orders/format";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  paid: "#22C55E",
  pending: "#F59E0B",
  partially_paid: "#60A5FA",
  refunded: "#EF4444",
};

type Stats = {
  ordersByDay: { label: string; orders: number; revenue: number }[];
  paymentBreakdown: { status: string; count: number }[];
};

function ChartCard({
  title,
  description,
  icon: Icon,
  iconTone,
  children,
}: {
  title: string;
  description: string;
  icon: typeof TrendingUp;
  iconTone: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
      <div className="flex items-start gap-3 border-b border-primary/10 bg-gradient-to-r from-brand-cream/40 to-brand-rose/20 px-4 py-4 sm:px-5">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            iconTone,
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

export function OrdersStatsCharts({ stats }: { stats: Stats }) {
  const breakdown = stats.paymentBreakdown.filter((b) => b.count > 0);
  const maxOrders = Math.max(...stats.ordersByDay.map((d) => d.orders), 1);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Orders — last 14 days"
        description="Daily order count"
        icon={TrendingUp}
        iconTone="bg-primary/15 text-primary"
      >
        <div className="h-56 w-full min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={stats.ordersByDay}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F8BBD0" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#F8BBD0" stopOpacity={0.05} />
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
                domain={[0, maxOrders + 1]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(248,187,208,0.35)",
                  boxShadow: "0 8px 24px -4px rgba(0,0,0,0.08)",
                  fontSize: 13,
                }}
                formatter={(value, name) => [
                  name === "orders" ? `${value} orders` : `₵${Number(value).toFixed(2)}`,
                  name === "orders" ? "Orders" : "Revenue",
                ]}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#F8BBD0"
                strokeWidth={2.5}
                fill="url(#ordersFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Payment status"
        description="Breakdown by payment state"
        icon={BarChart3}
        iconTone="bg-violet-500/15 text-violet-800"
      >
        {breakdown.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No orders yet</p>
        ) : (
          <div className="h-56 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={breakdown.map((b) => ({
                  ...b,
                  label: formatPaymentStatus(b.status),
                }))}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={90}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(248, 187, 208, 0.12)" }}
                  formatter={(value) => [`${value} orders`, "Count"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(248,187,208,0.35)",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={28}>
                  {breakdown.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "#F8BBD0"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
