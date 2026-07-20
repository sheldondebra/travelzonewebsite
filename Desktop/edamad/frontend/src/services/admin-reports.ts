import api from "@/lib/api";

export type AdminReportsResponse = {
  summary: {
    total_users: number;
    total_enrollments: number;
    completed_enrollments: number;
    open_tickets: number;
    total_revenue: number;
    revenue_this_month: number;
  };
  user_growth: {
    this_month: number;
    last_month: number;
    verified_students: number;
    unverified_students: number;
  };
  enrollment_chart: { month: string; enrollments: number; completions: number }[];
  course_completion: {
    id: number;
    title: string;
    enrollments: number;
    avg_progress: number;
    completion_rate: number;
  }[];
};

export async function fetchAdminReports() {
  const { data } = await api.get<AdminReportsResponse>("/admin/reports");
  return data;
}
