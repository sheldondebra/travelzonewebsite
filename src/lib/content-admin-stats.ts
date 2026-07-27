import { isMissingTableError } from "@/lib/db/errors";
import { withSqlTimeout } from "@/lib/db/postgres";

async function countTable(
  table: string,
  filter?: { column: string; value: string | number | boolean },
) {
  try {
    if (filter) {
      const rows = await withSqlTimeout(
        (sql) =>
          sql.unsafe<{ count: string }[]>(
            `select count(*)::text as count from public.${table} where ${filter.column} = $1`,
            [filter.value],
          ),
        5000,
      );
      return Number(rows[0]?.count ?? 0);
    }

    const rows = await withSqlTimeout(
      (sql) =>
        sql.unsafe<{ count: string }[]>(
          `select count(*)::text as count from public.${table}`,
        ),
      5000,
    );
    return Number(rows[0]?.count ?? 0);
  } catch (error) {
    if (isMissingTableError(error)) return 0;
    return 0;
  }
}

export async function getDashboardStats() {
  const [
    publishedTours,
    publishedPosts,
    pendingBookings,
    pendingTicketRequests,
    pendingConsultations,
    pendingMessages,
    subscribers,
    staffUsers,
    aboutTeamMembers,
  ] = await Promise.all([
    countTable("tours", { column: "status", value: "published" }),
    countTable("blog_posts", { column: "status", value: "published" }),
    countTable("tour_bookings", { column: "status", value: "pending" }),
    countTable("ticket_booking_requests", { column: "status", value: "pending" }),
    countTable("consultation_bookings", { column: "status", value: "pending" }),
    countTable("contact_messages", { column: "status", value: "pending" }),
    countTable("newsletter_subscribers"),
    countTable("users", { column: "is_active", value: true }),
    countTable("about_team_members", { column: "status", value: "published" }),
  ]);

  return {
    publishedTours,
    publishedPosts,
    pendingBookings,
    pendingTicketRequests,
    pendingConsultations,
    pendingMessages,
    subscribers,
    staffUsers,
    aboutTeamMembers,
  };
}
