import { BookingsDashboard } from "@/components/admin/BookingsDashboard";
import { listBookings } from "@/lib/bookings-store";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminBookingsPage() {
  await requireStaff();
  const bookings = await listBookings();

  return <BookingsDashboard bookings={bookings} />;
}
