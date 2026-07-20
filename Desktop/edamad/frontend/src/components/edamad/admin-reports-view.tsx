"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { getApiErrorMessage } from "@/lib/auth-errors";
import { fetchAdminReports, type AdminReportsResponse } from "@/services/admin-reports";

function formatGhs(amount: number) {
  return `GHS ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminReportsView() {
  const [data, setData] = useState<AdminReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetchAdminReports()
      .then(setData)
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load reports."));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="ed-card p-8 text-center text-[#6B7280]">Loading reports...</div>;
  }

  if (!data) {
    return (
      <div className="ed-card p-8 text-center text-[#6B7280]">
        Reports unavailable.{" "}
        <Link href="/admin/dashboard" className="text-[#0057FF] hover:underline">
          View dashboard
        </Link>
      </div>
    );
  }

  const { summary, user_growth, enrollment_chart, course_completion } = data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#002B7F]">Reports</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Enrollment trends, user growth, and course completion analytics.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total users", value: summary.total_users.toLocaleString() },
          { label: "Enrollments", value: summary.total_enrollments.toLocaleString() },
          { label: "Completed", value: summary.completed_enrollments.toLocaleString() },
          { label: "Open tickets", value: summary.open_tickets.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="ed-card p-4">
            <p className="text-[12px] text-[#6B7280]">{label}</p>
            <p className="mt-1 text-[24px] font-bold text-[#002B7F]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="ed-card p-5">
          <h3 className="mb-4 text-[15px] font-semibold text-[#002B7F]">Enrollment Trends</h3>
          <div className="h-[240px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollment_chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="enrollments" name="Enrollments" stroke="#0057FF" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="completions" name="Completions" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        <div className="ed-card p-5">
          <h3 className="mb-4 text-[15px] font-semibold text-[#002B7F]">User Growth</h3>
          <ul className="space-y-3 text-[13px]">
            <li className="flex justify-between"><span className="text-[#374151]">New users this month</span><span className="font-semibold text-[#002B7F]">{user_growth.this_month}</span></li>
            <li className="flex justify-between"><span className="text-[#374151]">New users last month</span><span className="font-semibold text-[#6B7280]">{user_growth.last_month}</span></li>
            <li className="flex justify-between"><span className="text-[#374151]">Verified students</span><span className="font-semibold text-[#16A34A]">{user_growth.verified_students}</span></li>
            <li className="flex justify-between"><span className="text-[#374151]">Unverified students</span><span className="font-semibold text-[#D97706]">{user_growth.unverified_students}</span></li>
            <li className="flex justify-between border-t border-[#E5EAF2] pt-3"><span className="text-[#374151]">Total revenue</span><span className="font-semibold text-[#0057FF]">{formatGhs(summary.total_revenue)}</span></li>
            <li className="flex justify-between"><span className="text-[#374151]">Revenue this month</span><span className="font-semibold text-[#0057FF]">{formatGhs(summary.revenue_this_month)}</span></li>
          </ul>
        </div>
      </div>

      <div className="ed-card p-5">
        <h3 className="mb-4 text-[15px] font-semibold text-[#002B7F]">Course Completion Rates</h3>
        <ul className="space-y-4">
          {course_completion.map((course) => (
            <li key={course.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-medium text-[#374151]">{course.title}</p>
                <span className="shrink-0 text-[12px] font-semibold text-[#16A34A]">{course.completion_rate}%</span>
              </div>
              <p className="text-[11px] text-[#9CA3AF]">{course.enrollments} enrollments · avg progress {course.avg_progress}%</p>
              <ProgressBar value={course.completion_rate} className="mt-1.5" height={6} color="#22C55E" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
