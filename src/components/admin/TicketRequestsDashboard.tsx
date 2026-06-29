import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { TicketRequestsList } from "@/components/admin/TicketRequestsList";
import type { TicketRequest } from "@/lib/ticket-requests";

type Props = {
  requests: TicketRequest[];
};

export function TicketRequestsDashboard({ requests }: Props) {
  return (
    <>
      <AdminPageHeader
        title="Ticket requests"
        description="Flight ticket requests from the public site. Search fares offline and update status as you quote and book."
        actions={
          <Link href="/tickets" target="_blank" className="admin-button-secondary">
            View request page
          </Link>
        }
      />

      <TicketRequestsList requests={requests} />
    </>
  );
}
