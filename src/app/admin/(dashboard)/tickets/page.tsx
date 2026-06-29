import { TicketRequestsDashboard } from "@/components/admin/TicketRequestsDashboard";
import { listTicketRequests } from "@/lib/ticket-requests-store";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminTicketsPage() {
  await requireStaff();
  const requests = await listTicketRequests();

  return <TicketRequestsDashboard requests={requests} />;
}
