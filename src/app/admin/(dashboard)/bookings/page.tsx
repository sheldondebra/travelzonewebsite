import { BookingsDashboard } from "@/components/admin/BookingsDashboard";
import { listBookings } from "@/lib/bookings-store";
import { getConsultationAvailability } from "@/lib/site-settings";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminBookingsPage() {
  await requireStaff();
  const [bookings, availability] = await Promise.all([
    listBookings(),
    getConsultationAvailability(),
  ]);

  return (
    <BookingsDashboard bookings={bookings} availability={availability} />
  );
}
