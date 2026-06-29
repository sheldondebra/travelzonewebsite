import type { TourBooking } from "@/lib/bookings";
import { getBookingByReference } from "@/lib/bookings-store";

export async function getBookingForConfirmation(reference?: string | null) {
  const normalized = reference?.trim();
  if (!normalized) return null;
  return getBookingByReference(normalized);
}

export function canViewBookingDetails(
  booking: TourBooking | null,
  reference?: string | null,
): booking is TourBooking {
  if (!booking || !reference?.trim()) return false;
  return booking.paystackReference === reference.trim();
}
