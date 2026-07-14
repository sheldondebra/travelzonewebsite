import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsultationStatusForm } from "@/components/admin/ConsultationStatusForm";
import { AdminPageHeader, AdminWidget } from "@/components/admin/AdminChrome";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatConsultationDate,
  formatConsultationDateTime,
} from "@/lib/consultation-admin";
import { getModeLabel, getTimeSlotLabel, getTopicLabel } from "@/lib/consultations";
import { getConsultationById } from "@/lib/consultations-store";
import { getStaffUser } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminConsultationDetailPage({ params }: Props) {
  const { id } = await params;
  const booking = await getConsultationById(id);
  if (!booking) notFound();

  const staff = await getStaffUser();

  return (
    <>
      <AdminPageHeader
        title={`Consultation ${booking.id}`}
        description={`Submitted ${formatConsultationDateTime(booking.createdAt)}`}
        actions={
          <Link href="/admin/consultations" className="admin-button-secondary">
            Back to list
          </Link>
        }
      />

      <div className="admin-dashboard-columns">
        <AdminWidget title="Consultation details">
          <table className="admin-list-table">
            <tbody>
              <DetailRow label="Customer" value={booking.fullName} />
              <DetailRow
                label="Email"
                value={
                  <a href={`mailto:${booking.email}`} className="text-[#2271b1]">
                    {booking.email}
                  </a>
                }
              />
              <DetailRow
                label="Phone"
                value={
                  <a href={`tel:${booking.phone}`} className="text-[#2271b1]">
                    {booking.phone}
                  </a>
                }
              />
              <DetailRow
                label="Date"
                value={formatConsultationDate(booking.preferredDate)}
              />
              <DetailRow
                label="Time"
                value={getTimeSlotLabel(booking.preferredTime)}
              />
              <DetailRow label="Topic" value={getTopicLabel(booking.topic)} />
              <DetailRow label="Meeting" value={getModeLabel(booking.mode)} />
              <DetailRow label="Status" value={<StatusBadge status={booking.status} />} />
              {booking.notes ? (
                <DetailRow label="Notes" value={booking.notes} />
              ) : null}
            </tbody>
          </table>
        </AdminWidget>

        {staff?.role === "admin" ? (
          <AdminWidget title="Update status">
            <ConsultationStatusForm
              bookingId={booking.id}
              currentStatus={booking.status}
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
