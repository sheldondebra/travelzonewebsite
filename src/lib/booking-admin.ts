import type { TourBooking } from "@/lib/bookings";

export type BookingFilter =
  | "all"
  | "pending-payment"
  | "paid"
  | "pending-review"
  | "confirmed"
  | "cancelled";

export function getBookingStats(bookings: TourBooking[]) {
  return {
    total: bookings.length,
    pendingPayment: bookings.filter(
      (booking) =>
        booking.paymentStatus === "pending" || booking.paymentStatus === "unpaid",
    ).length,
    paid: bookings.filter((booking) => booking.paymentStatus === "paid").length,
    pendingReview: bookings.filter((booking) => booking.status === "pending").length,
    confirmed: bookings.filter((booking) => booking.status === "confirmed").length,
    cancelled: bookings.filter((booking) => booking.status === "cancelled").length,
  };
}

export function formatTravelDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatBookingDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function bookingAmountLabel(booking: TourBooking) {
  if (booking.paymentStatus === "paid" && booking.paidAmount != null) {
    return { label: "Paid", amount: booking.paidAmount };
  }
  return { label: "Estimated", amount: booking.estimatedTotal };
}

export function matchesBookingFilter(booking: TourBooking, filter: BookingFilter) {
  switch (filter) {
    case "pending-payment":
      return booking.paymentStatus === "pending" || booking.paymentStatus === "unpaid";
    case "paid":
      return booking.paymentStatus === "paid";
    case "pending-review":
      return booking.status === "pending";
    case "confirmed":
      return booking.status === "confirmed";
    case "cancelled":
      return booking.status === "cancelled";
    default:
      return true;
  }
}

export function matchesBookingSearch(booking: TourBooking, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    booking.id,
    booking.fullName,
    booking.email,
    booking.phone,
    booking.tourTitle,
    booking.paystackReference ?? "",
  ].some((value) => value.toLowerCase().includes(normalized));
}
