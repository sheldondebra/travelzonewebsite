"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS: Record<string, string> = {
  Revenue: "#E8A4B8",
  "Gross profit": "#22C55E",
  Expenses: "#F59E0B",
};

function fmtTooltip(value: number, currency = "GHS") {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function AnalyticsCharts({
  revenue,
  profit,
  expenses = 0,
  currency = "GHS",
}: {
  revenue: number;
  profit: number;
  expenses?: number;
  currency?: string;
}) {
  const data = [
    { name: "Revenue", value: Math.max(0, revenue) },
    { name: "Gross profit", value: Math.max(0, profit) },
    { name: "Expenses", value: Math.max(0, expenses) },
  ];

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white/95 shadow-card">
      <div className="border-b border-primary/10 bg-gradient-to-r from-brand-cream/60 via-brand-rose/25 to-primary/10 px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold">Financial summary</h3>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          All-time revenue, gross profit, and expenses
        </p>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
          <div className="h-64 min-h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barCategoryGap="32%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                  domain={[0, maxVal * 1.1]}
                />
                <Tooltip
                  cursor={{ fill: "rgba(248, 187, 208, 0.08)" }}
                  formatter={(value) =>
                    fmtTooltip(Number(value ?? 0), currency)
                  }
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #F3F4F6",
                    boxShadow: "0 8px 24px -4px rgba(0,0,0,0.08)",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={56}>
                  {data.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[entry.name] ?? "#F8BBD0"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex flex-wrap gap-4 sm:gap-6 lg:flex-col lg:justify-center">
            {data.map((row) => (
              <li key={row.name} className="flex min-w-[7rem] flex-1 items-center gap-3 lg:min-w-0 lg:flex-none">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[row.name] }}
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{row.name}</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {fmtTooltip(row.value, currency)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
