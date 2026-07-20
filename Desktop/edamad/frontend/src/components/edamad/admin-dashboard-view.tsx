"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  ChevronRight,
  FolderOpen,
  Megaphone,
  Plus,
  RefreshCw,
  Ticket,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { ProgressBar } from "@/components/edamad/progress-bar";
import {
  adminStats as fallbackStats,
  adminTickets as fallbackTickets,
  enrollmentChartData as fallbackChart,
  filterDashboardSearch,
  recentActivities as fallbackActivities,
  topCourses as fallbackCourses,
  userBreakdown as fallbackBreakdown,
  type AdminActivity,
  type AdminStat,
  type AdminTicket,
  type TopCourse,
} from "@/lib/admin-dashboard-data";
import { getApiErrorMessage } from "@/lib/auth-errors";
import { ADMIN_DASHBOARD_QUERY_KEY, useAdminDashboard } from "@/hooks/use-admin-dashboard";

const statIcons: LucideIcon[] = [Users, BookOpen, GraduationCap, Award, Ticket];

const activityIcons: Record<AdminActivity["type"], LucideIcon> = {
  user: UserPlus,
  course: BookOpen,
  lesson: Video,
  certificate: Award,
  ticket: Ticket,
};

const priorityStyles = {
  High: "bg-[#FEE2E2] text-[#991B1B]",
  Medium: "bg-[#FFEDD5] text-[#9A3412]",
  Low: "bg-[#DCFCE7] text-[#166534]",
};

const statusStyles = {
  Open: "border border-[#22C55E] text-[#166534] bg-[#F0FDF4]",
  "In Progress": "border border-[#0057FF] text-[#0057FF] bg-[#EBF2FF]",
  Resolved: "border border-[#D1D5DB] text-[#6B7280] bg-[#F9FAFB]",
};

const quickActions = [
  {
    href: "/admin/courses/create",
    label: "Add Course",
    description: "Create a new catalog course",
    icon: Plus,
    iconBg: "#EBF2FF",
    iconColor: "#0057FF",
  },
  {
    href: "/admin/students",
    label: "Manage Users",
    description: "Students and admin accounts",
    icon: UserPlus,
    iconBg: "#EDE9FE",
    iconColor: "#7C3AED",
  },
  {
    href: "/admin/announcements",
    label: "Announcements",
    description: "Email and broadcast updates",
    icon: Megaphone,
    iconBg: "#FFEDD5",
    iconColor: "#C2410C",
  },
  {
    href: "/admin/courses/upload",
    label: "Upload Video",
    description: "Add lesson media files",
    icon: Video,
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
  },
  {
    href: "/admin/tickets",
    label: "Support Tickets",
    description: "Review student requests",
    icon: Ticket,
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
  },
  {
    href: "/admin/materials",
    label: "Learning Materials",
    description: "Files, thumbnails, and assets",
    icon: FolderOpen,
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
  },
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-[#E5EAF2] bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-[12px] font-semibold text-[#002B7F]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-[11px] text-[#374151]">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="ed-card animate-pulse p-4">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-lg bg-[#E5EAF2]" />
        <div className="h-4 w-12 rounded bg-[#E5EAF2]" />
      </div>
      <div className="mt-3 h-7 w-16 rounded bg-[#E5EAF2]" />
      <div className="mt-2 h-3 w-24 rounded bg-[#E5EAF2]" />
    </div>
  );
}

function StatCard({ stat, icon: Icon }: { stat: AdminStat; icon: LucideIcon }) {
  const positive = stat.trend >= 0;
  return (
    <div className="ed-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0057FF]">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <span
          className={`flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
            positive ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FEF2F2] text-[#DC2626]"
          }`}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(stat.trend)}%
        </span>
      </div>
      <p className="mt-3 text-[24px] font-bold leading-none text-[#002B7F]">{stat.value.toLocaleString()}</p>
      <p className="mt-1.5 text-[12px] font-medium text-[#374151]">{stat.label}</p>
      <p className="mt-0.5 text-[10px] text-[#9CA3AF]">
        {positive ? "↑" : "↓"} {Math.abs(stat.trend)}% {stat.trendLabel}
      </p>
    </div>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-[15px] font-semibold text-[#002B7F]">{title}</h3>
      {href ? (
        <Link href={href} className="text-[12px] font-medium text-[#0057FF] hover:underline">
          {linkLabel ?? "View all"}
        </Link>
      ) : null}
    </div>
  );
}

type AdminDashboardViewProps = {
  searchQuery?: string;
};

export function AdminDashboardView({ searchQuery = "" }: AdminDashboardViewProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, isFetching } = useAdminDashboard();
  const [chartRange, setChartRange] = useState("6");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isError) {
      toast.error(getApiErrorMessage(error, "Unable to load dashboard data."));
    }
  }, [isError, error]);

  const stats = data?.stats ?? fallbackStats;
  const topCourses = data?.top_courses ?? fallbackCourses;
  const userBreakdown = data?.user_breakdown ?? fallbackBreakdown;
  const totalUsers = data?.total_users ?? fallbackBreakdown.reduce((sum, item) => sum + item.count, 0);
  const enrollmentChartData = data?.enrollment_chart ?? fallbackChart;
  const recentActivities = data?.recent_activities ?? fallbackActivities;
  const adminTickets = data?.tickets ?? fallbackTickets;
  const systemHealth = data?.system_health ?? {
    server: "Operational",
    database: "Operational",
    backup: "Up to date",
    storage_percent: 62,
  };
  const usingFallback = isError || !data;

  const filtered = useMemo(
    () =>
      filterDashboardSearch(searchQuery, {
        tickets: adminTickets,
        courses: topCourses,
        activities: recentActivities,
      }),
    [searchQuery, adminTickets, topCourses, recentActivities],
  );

  const chartData = chartRange === "3" ? enrollmentChartData.slice(-3) : enrollmentChartData;
  const visibleActivities = searchQuery ? filtered.activities : recentActivities;
  const visibleCourses = searchQuery ? filtered.courses : topCourses;
  const visibleTickets = searchQuery ? filtered.tickets : adminTickets;

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="ed-card h-[280px] animate-pulse bg-[#F7F9FC]" />
          <div className="ed-card h-[280px] animate-pulse bg-[#F7F9FC]" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Dashboard</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Overview of users, courses, enrollments, and platform health.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="ed-btn-outline gap-2 text-[13px] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {usingFallback ? (
        <div className="mb-4 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13px] text-[#92400E]">
          Showing cached sample data. Check that you are logged in as admin and the API is running.
        </div>
      ) : null}

      {searchQuery ? (
        <p className="mb-4 text-[13px] text-[#6B7280]">
          Filtering dashboard for <span className="font-medium text-[#002B7F]">&quot;{searchQuery}&quot;</span>
        </p>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} icon={statIcons[i] ?? Users} />
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="ed-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-semibold text-[#002B7F]">Enrollment Overview</h3>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value)}
              className="ed-input h-9 w-auto min-w-[140px] py-0 text-[12px]"
            >
              <option value="6">Last 6 Months</option>
              <option value="3">Last 3 Months</option>
            </select>
          </div>
          <div className="h-[240px] min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="enrollments"
                    name="Enrollments"
                    stroke="#0057FF"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#0057FF" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completions"
                    name="Completions"
                    stroke="#22C55E"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#22C55E" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        <div className="ed-card flex flex-col p-5">
          <SectionHeader title="Recent Activities" />
          <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {visibleActivities.length === 0 ? (
              <li className="py-6 text-center text-[13px] text-[#9CA3AF]">No activities match your search.</li>
            ) : (
              visibleActivities.map((activity: AdminActivity) => {
                const Icon = activityIcons[activity.type] ?? BookOpen;
                return (
                  <li
                    key={activity.id}
                    className="flex gap-3 border-b border-[#E5EAF2] pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0057FF]">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] leading-snug text-[#374151]">{activity.text}</p>
                      <p className="mt-0.5 text-[11px] text-[#9CA3AF]">{activity.time}</p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <div className="ed-card p-5">
          <SectionHeader title="Top Courses" href="/admin/courses" />
          <ul className="space-y-4">
            {visibleCourses.length === 0 ? (
              <li className="py-4 text-center text-[13px] text-[#9CA3AF]">No courses match your search.</li>
            ) : (
              visibleCourses.map((course: TopCourse) => (
                <li key={course.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-medium text-[#374151]">{course.title}</p>
                    <span className="shrink-0 text-[12px] font-semibold text-[#16A34A]">{course.completion}%</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {course.enrollments.toLocaleString()} enrollment{course.enrollments === 1 ? "" : "s"}
                  </p>
                  <ProgressBar value={course.completion} className="mt-1.5" height={6} color="#22C55E" />
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="ed-card p-5">
          <SectionHeader title="User Breakdown" href="/admin/students" linkLabel="Manage users" />
          <div className="relative mx-auto h-[180px] w-full min-w-0 max-w-[200px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={userBreakdown.filter((entry) => entry.count > 0)}
                    dataKey="count"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {userBreakdown
                      .filter((entry) => entry.count > 0)
                      .map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : null}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[20px] font-bold text-[#002B7F]">{totalUsers.toLocaleString()}</p>
              <p className="text-[10px] text-[#6B7280]">Total Users</p>
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {userBreakdown.map((item) => (
              <li key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-[#374151]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="font-medium text-[#6B7280]">
                  {item.count} ({item.percent}%)
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ed-card p-5">
          <SectionHeader title="System Health" href="/admin/logs" linkLabel="View logs" />
          <ul className="space-y-3 text-[13px]">
            {[
              { label: "Server Status", value: systemHealth.server },
              { label: "Database", value: systemHealth.database },
              { label: "Backup Status", value: systemHealth.backup },
            ].map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-[#374151]">{item.label}</span>
                <span className="flex items-center gap-1 font-medium text-[#16A34A]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {item.value}
                </span>
              </li>
            ))}
            <li>
              <div className="flex items-center justify-between">
                <span className="text-[#374151]">Storage Usage</span>
                <span className="font-semibold text-[#0057FF]">{systemHealth.storage_percent}%</span>
              </div>
              <ProgressBar value={systemHealth.storage_percent} className="mt-1.5" />
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="ed-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[#E5EAF2] px-5 py-4">
            <h3 className="text-[15px] font-semibold text-[#002B7F]">Recent Support Tickets</h3>
            <Link href="/admin/tickets" className="text-[12px] font-medium text-[#0057FF] hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            {visibleTickets.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]">
                {searchQuery ? "No tickets match your search." : "No support tickets yet."}
              </p>
            ) : (
              <table className="w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5EAF2] bg-[#F7F9FC] text-left text-[#6B7280]">
                    <th className="px-5 py-2.5 font-medium">Ticket ID</th>
                    <th className="px-3 py-2.5 font-medium">Subject</th>
                    <th className="px-3 py-2.5 font-medium">User</th>
                    <th className="px-3 py-2.5 font-medium">Priority</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTickets.map((ticket: AdminTicket) => (
                    <tr key={ticket.id} className="border-b border-[#E5EAF2] last:border-0 hover:bg-[#F7F9FC]/60">
                      <td className="px-5 py-3 font-medium text-[#0057FF]">
                        <Link href="/admin/tickets" className="hover:underline">
                          {ticket.id}
                        </Link>
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-3 text-[#374151]">{ticket.subject}</td>
                      <td className="px-3 py-3 text-[#6B7280]">{ticket.user}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${priorityStyles[ticket.priority]}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyles[ticket.status]}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#9CA3AF]">{ticket.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="ed-card flex flex-col p-5 lg:sticky lg:top-4">
          <SectionHeader title="Quick Actions" />
          <ul className="space-y-2">
            {quickActions.map(({ href, label, description, icon: Icon, iconBg, iconColor }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 rounded-[10px] border border-[#E5EAF2] bg-white px-3 py-3 transition-all hover:border-[#0057FF]/40 hover:bg-[#F7F9FC] hover:shadow-sm"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: iconBg, color: iconColor }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#002B7F]">{label}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-[#6B7280]">{description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#C4CDD8] transition-colors group-hover:text-[#0057FF]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
