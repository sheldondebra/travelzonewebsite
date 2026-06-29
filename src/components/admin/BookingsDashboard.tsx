import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { BookingsList } from "@/components/admin/BookingsList";
import type { TourBooking } from "@/lib/bookings";

type Props = {
  bookings: TourBooking[];
};

export function BookingsDashboard({ bookings }: Props) {
  return (
    <>
      <AdminPageHeader
        title="Bookings"
        description="Tour package reservations and payment status from the public book page."
        actions={
          <Link href="/book" target="_blank" className="admin-button-secondary">
            View book page
          </Link>
        }
      />

      <BookingsList bookings={bookings} />
    </>
  );
}
