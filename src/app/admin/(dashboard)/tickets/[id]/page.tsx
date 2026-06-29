import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketRequestStatusForm } from "@/components/admin/TicketRequestStatusForm";
import { AdminPageHeader, AdminWidget } from "@/components/admin/AdminChrome";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatTicketDate,
  formatTicketDateTime,
} from "@/lib/ticket-request-admin";
import {
  getCabinClassLabel,
  getTripTypeLabel,
} from "@/lib/ticket-requests";
import { getTicketRequestById } from "@/lib/ticket-requests-store";
import { getStaffUser } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminTicketRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = await getTicketRequestById(id);
  if (!request) notFound();

  const staff = await getStaffUser();

  return (
    <>
      <AdminPageHeader
        title={`Ticket request ${request.id}`}
        description={`Submitted ${formatTicketDateTime(request.createdAt)}`}
        actions={
          <Link href="/admin/tickets" className="admin-button-secondary">
            Back to list
          </Link>
        }
      />

      <div className="admin-dashboard-columns">
        <AdminWidget title="Request details">
          <table className="admin-list-table">
            <tbody>
              <DetailRow label="Customer" value={request.fullName} />
              <DetailRow
                label="Email"
                value={
                  <a href={`mailto:${request.email}`} className="text-[#2271b1]">
                    {request.email}
                  </a>
                }
              />
              <DetailRow
                label="Phone"
                value={
                  <a href={`tel:${request.phone}`} className="text-[#2271b1]">
                    {request.phone}
                  </a>
                }
              />
              <DetailRow label="Route" value={`${request.origin} → ${request.destination}`} />
              <DetailRow label="Trip type" value={getTripTypeLabel(request.tripType)} />
              <DetailRow label="Departure" value={formatTicketDate(request.departureDate)} />
              {request.returnDate ? (
                <DetailRow label="Return" value={formatTicketDate(request.returnDate)} />
              ) : null}
              <DetailRow label="Passengers" value={String(request.passengers)} />
              <DetailRow label="Cabin" value={getCabinClassLabel(request.cabinClass)} />
              <DetailRow
                label="Flexible dates"
                value={request.flexibleDates ? "Yes" : "No"}
              />
              <DetailRow label="Status" value={<StatusBadge status={request.status} />} />
              {request.notes ? <DetailRow label="Notes" value={request.notes} /> : null}
            </tbody>
          </table>
        </AdminWidget>

        {staff?.role === "admin" ? (
          <AdminWidget title="Update status">
            <TicketRequestStatusForm
              requestId={request.id}
              currentStatus={request.status}
            />
          </AdminWidget>
        ) : null}
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <th className="w-40 font-semibold text-[#646970]">{label}</th>
      <td>{value}</td>
    </tr>
  );
}
