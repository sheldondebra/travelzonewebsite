"use server";

import type { BookingInput, BookingResult } from "@/lib/bookings";
import {
  createBookingId,
  createPaystackReference,
  saveBooking,
} from "@/lib/bookings-store";
import {
  appUrl,
  ghsToPesewas,
  initializePaystackTransaction,
} from "@/lib/paystack";
import { getTourBySlug, getTourPaymentTotalGhsAsync } from "@/lib/tours";
import { isPaystackConfiguredAsync } from "@/lib/payment-config";

function validateInput(input: BookingInput): string | null {
  if (!input.fullName.trim()) return "Full name is required.";
  if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return "A valid email address is required.";
  }
  if (!input.phone.trim()) return "Phone number is required.";
  if (!input.travelDate) return "Please select a travel date.";
  if (input.travelers < 1 || input.travelers > 50) {
    return "Number of travelers must be between 1 and 50.";
  }

  const todayIso = new Date().toISOString().split("T")[0];
  if (input.travelDate < todayIso) {
    return "Travel date cannot be in the past.";
  }

  return null;
}

export async function createBookingAndPay(
  input: BookingInput
): Promise<BookingResult> {
  const validationError = validateInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  if (!(await isPaystackConfiguredAsync())) {
    return {
      success: false,
      error:
        "Online payment is not configured yet. Add Paystack keys to your environment, or call us to book by phone.",
    };
  }

  const tour = await getTourBySlug(input.tourSlug);
  if (!tour) {
    return { success: false, error: "This tour is no longer available." };
  }

  const bookingId = createBookingId();
  const reference = createPaystackReference(bookingId);
  const payment = await getTourPaymentTotalGhsAsync(tour, input.travelers);
  const estimatedTotal = payment.paymentGhs;
  const packageUsd =
    tour.currency === "USD" ? tour.price * input.travelers : undefined;

  const booking = {
    id: bookingId,
    tourSlug: input.tourSlug,
    tourTitle: input.tourTitle,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    travelDate: input.travelDate,
    travelers: input.travelers,
    specialRequests: input.specialRequests?.trim() || undefined,
    estimatedTotal,
    currency: "GHS" as const,
    status: "pending" as const,
    paymentStatus: "pending" as const,
    paystackReference: reference,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveBooking(booking);

    const paystack = await initializePaystackTransaction({
      email: booking.email,
      amountPesewas: ghsToPesewas(estimatedTotal),
      reference,
      callbackUrl: `${appUrl()}/booking/payment/verify`,
      metadata: {
        booking_id: bookingId,
        tour_slug: input.tourSlug,
        tour_title: input.tourTitle,
        travelers: String(input.travelers),
        exchange_rate: String(payment.rate),
        ...(packageUsd !== undefined && { package_usd: String(packageUsd) }),
      },
    });

    return {
      success: true,
      authorizationUrl: paystack.authorization_url,
      accessCode: paystack.access_code,
      reference: paystack.reference,
      bookingId,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Payment could not be started. Please try again or call us.",
    };
  }
}
