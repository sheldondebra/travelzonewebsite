import Link from "next/link";
import { AdminPageHeader, AdminWidget } from "@/components/admin/AdminChrome";
import { BookingsList } from "@/components/admin/BookingsList";
import type { TourBooking } from "@/lib/bookings";
import { getBookingStats } from "@/lib/booking-admin";

type Props = {
  bookings: TourBooking[];
};

export function BookingsDashboard({ bookings }: Props) {
  const stats = getBookingStats(bookings);

  return (
    <>
      <AdminPageHeader
        title="Bookings"
        actions={
          <Link href="/book" target="_blank" className="admin-button-secondary">
            View book page
          </Link>
        }
      />

      <div className="admin-dashboard-columns mb-5">
        <AdminWidget title="Summary">
          <ul className="admin-glance-list">
            <li>
              <strong>{stats.total}</strong> total bookings
            </li>
            <li>
              <strong>{stats.pendingPayment}</strong> awaiting payment
            </li>
            <li>
              <strong>{stats.paid}</strong> paid
            </li>
            <li>
              <strong>{stats.pendingReview}</strong> pending review
            </li>
          </ul>
        </AdminWidget>
      </div>

      <BookingsList bookings={bookings} />
    </>
  );
}
