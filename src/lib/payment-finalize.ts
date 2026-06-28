import {
  getBookingById,
  getBookingByReference,
  saveBooking,
} from "@/lib/bookings-store";
import { sendBookingPaidEmails } from "@/lib/email";
import { notifyBookingPayment } from "@/lib/splitsms";
import { pesewasToGhs, verifyPaystackTransaction } from "@/lib/paystack";

export async function finalizeSuccessfulPayment(reference: string) {
  const verified = await verifyPaystackTransaction(reference);

  if (verified.status !== "success") {
    const booking = await getBookingByReference(reference);
    if (booking) {
      booking.paymentStatus = "failed";
      await saveBooking(booking);
    }
    return { paid: false as const, bookingId: booking?.id };
  }

  let booking = await getBookingByReference(reference);

  if (!booking) {
    const meta = verified.metadata as Record<string, unknown> | undefined;
    const bookingId =
      (typeof meta?.booking_id === "string" && meta.booking_id) ||
      reference.match(/^TZ-([A-Z0-9]+)-/)?.[1];

    if (bookingId) {
      booking = await getBookingById(bookingId);
    }
  }

  if (!booking) {
    throw new Error("Booking not found for this payment reference.");
  }

  if (booking.paymentStatus === "paid") {
    return { paid: true as const, bookingId: booking.id, alreadyPaid: true };
  }

  const paidAmountGhs = pesewasToGhs(verified.amount);

  booking.paymentStatus = "paid";
  booking.status = "confirmed";
  booking.paidAmount = paidAmountGhs;
  booking.paidAt = verified.paid_at ?? new Date().toISOString();
  booking.paystackReference = verified.reference;

  await saveBooking(booking);

  try {
    await notifyBookingPayment({
      id: booking.id,
      fullName: booking.fullName,
      phone: booking.phone,
      tourTitle: booking.tourTitle,
      travelDate: booking.travelDate,
      travelers: booking.travelers,
      paidAmountGhs,
    });
  } catch {
    // Payment succeeded; SMS failure should not block confirmation page.
  }

  try {
    await sendBookingPaidEmails({
      id: booking.id,
      fullName: booking.fullName,
      email: booking.email,
      tourTitle: booking.tourTitle,
      travelDate: booking.travelDate,
      travelers: booking.travelers,
      paidAmountGhs,
    });
  } catch {
    // Payment succeeded; email failure should not block confirmation page.
  }

  return { paid: true as const, bookingId: booking.id, alreadyPaid: false };
}
