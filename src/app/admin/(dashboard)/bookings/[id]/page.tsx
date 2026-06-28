import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingStatusForm } from "@/components/admin/BookingStatusForm";
import { AdminPageHeader, AdminWidget } from "@/components/admin/AdminChrome";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { bookingAmountLabel, formatBookingDateTime, formatTravelDate } from "@/lib/booking-admin";
import { getBookingById } from "@/lib/bookings-store";
import { formatPrice } from "@/lib/tours";
import { getStaffUser } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  const staff = await getStaffUser();
  const amount = bookingAmountLabel(booking);

  return (
    <>
      <AdminPageHeader
        title={`Booking ${booking.id}`}
        description={`Submitted ${formatBookingDateTime(booking.createdAt)}`}
        actions={
          <Link href="/admin/bookings" className="admin-button-secondary">
            Back to list
          </Link>
        }
      />

      <div className="admin-dashboard-columns">
        <AdminWidget title="Booking details">
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
              <DetailRow label="Tour" value={booking.tourTitle} />
              <DetailRow
                label="Package"
                value={
                  <Link href={`/tours/${booking.tourSlug}`} target="_blank" className="text-[#2271b1]">
                    View tour
                  </Link>
                }
              />
              <DetailRow label="Travel date" value={formatTravelDate(booking.travelDate)} />
              <DetailRow label="Travelers" value={String(booking.travelers)} />
              <DetailRow label="Payment" value={<StatusBadge status={booking.paymentStatus} />} />
              <DetailRow label="Status" value={<StatusBadge status={booking.status} />} />
              <DetailRow label={amount.label} value={formatPrice(amount.amount)} />
              {booking.paystackReference ? (
                <DetailRow label="Paystack ref" value={booking.paystackReference} />
              ) : null}
              {booking.specialRequests ? (
                <DetailRow label="Special requests" value={booking.specialRequests} />
              ) : null}
            </tbody>
          </table>
        </AdminWidget>

        {staff?.role === "admin" ? (
          <AdminWidget title="Update status">
            <BookingStatusForm bookingId={booking.id} currentStatus={booking.status} />
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
