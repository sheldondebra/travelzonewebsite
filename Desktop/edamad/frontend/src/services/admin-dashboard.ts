import api from "@/lib/api";
import type {
  AdminActivity,
  AdminStat,
  AdminTicket,
  TopCourse,
  UserBreakdown,
} from "@/lib/admin-dashboard-data";

export type AdminDashboardResponse = {
  stats: AdminStat[];
  top_courses: TopCourse[];
  user_breakdown: UserBreakdown[];
  total_users: number;
  enrollment_chart: { month: string; enrollments: number; completions: number }[];
  recent_activities: AdminActivity[];
  tickets: AdminTicket[];
  open_ticket_count: number;
  system_health: {
    server: string;
    database: string;
    backup: string;
    storage_percent: number;
  };
};

export async function fetchAdminDashboard() {
  const { data } = await api.get<AdminDashboardResponse>("/admin/dashboard");
  return data;
}
