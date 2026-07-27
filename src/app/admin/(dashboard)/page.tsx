import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getDashboardStats } from "@/lib/content-admin";
import { requireStaff } from "@/lib/auth/staff";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user, role } = await requireStaff();
  const { error } = await searchParams;

  let stats = {
    publishedTours: 0,
    publishedPosts: 0,
    pendingBookings: 0,
    pendingTicketRequests: 0,
    pendingConsultations: 0,
    pendingMessages: 0,
    subscribers: 0,
    staffUsers: 0,
    aboutTeamMembers: 0,
  };

  try {
    stats = await getDashboardStats();
  } catch {
    // Keep the dashboard reachable even if a stats query fails.
  }

  return (
    <AdminDashboard
      stats={stats}
      role={role}
      email={user.email ?? "Staff"}
      forbidden={error === "forbidden"}
    />
  );
}
