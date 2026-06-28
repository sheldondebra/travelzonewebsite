import type { ConsultationBooking } from "@/lib/consultations";
import {
  formatTravelDate,
  formatBookingDateTime,
} from "@/lib/booking-admin";

export type ConsultationFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export function getConsultationStats(bookings: ConsultationBooking[]) {
  return {
    total: bookings.length,
    pending: bookings.filter((booking) => booking.status === "pending").length,
    confirmed: bookings.filter((booking) => booking.status === "confirmed").length,
    completed: bookings.filter((booking) => booking.status === "completed").length,
    cancelled: bookings.filter((booking) => booking.status === "cancelled").length,
  };
}

export function formatConsultationDate(date: string) {
  return formatTravelDate(date);
}

export function formatConsultationDateTime(iso: string) {
  return formatBookingDateTime(iso);
}

export function matchesConsultationFilter(
  booking: ConsultationBooking,
  filter: ConsultationFilter,
) {
  if (filter === "all") return true;
  return booking.status === filter;
}

export function matchesConsultationSearch(
  booking: ConsultationBooking,
  query: string,
) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    booking.id,
    booking.fullName,
    booking.email,
    booking.phone,
    booking.topic,
    booking.mode,
  ].some((value) => value.toLowerCase().includes(normalized));
}
