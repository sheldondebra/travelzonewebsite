"use server";

import type { TicketRequestInput, TicketRequestResult } from "@/lib/ticket-requests";
import { cabinClasses, tripTypes } from "@/lib/ticket-requests";
import {
  createTicketRequestId,
  saveTicketRequest,
} from "@/lib/ticket-requests-store";
import { sendTicketRequestEmails } from "@/lib/email";
import { getLocalTodayIso } from "@/lib/date-utils";
import { rateLimitFromHeaders } from "@/lib/rate-limit";

function validateInput(input: TicketRequestInput): string | null {
  if (!input.fullName.trim()) return "Full name is required.";

  if (
    !input.email.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())
  ) {
    return "A valid email address is required.";
  }

  const phone = input.phone.trim().replace(/[\s-]/g, "");
  if (!phone) return "Phone number is required.";
  if (!/^(\+233|0)[2-9]\d{8}$/.test(phone)) {
    return "Enter a valid Ghana phone number (e.g. 0244 274 663).";
  }

  if (!tripTypes.some((item) => item.value === input.tripType)) {
    return "Please select a trip type.";
  }

  if (!input.origin.trim()) return "Departure city or airport is required.";
  if (!input.destination.trim()) return "Destination city or airport is required.";

  if (!input.departureDate) return "Departure date is required.";
  if (input.departureDate < getLocalTodayIso()) {
    return "Departure date cannot be in the past.";
  }

  if (input.tripType === "round-trip") {
    if (!input.returnDate) return "Return date is required for round trips.";
    if (input.returnDate < input.departureDate) {
      return "Return date must be on or after departure.";
    }
  }

  if (!Number.isFinite(input.passengers) || input.passengers < 1 || input.passengers > 20) {
    return "Enter between 1 and 20 passengers.";
  }

  if (!cabinClasses.some((item) => item.value === input.cabinClass)) {
    return "Please select a cabin class.";
  }

  return null;
}

function normalizeInput(input: TicketRequestInput): TicketRequestInput {
  return {
    ...input,
    passengers:
      typeof input.passengers === "string"
        ? Number(input.passengers)
        : input.passengers,
  };
}

export async function submitTicketRequest(
  input: TicketRequestInput,
): Promise<TicketRequestResult> {
  const normalized = normalizeInput(input);

  const limit = await rateLimitFromHeaders("ticket-request-form", 5, 30 * 60 * 1000);
  if (!limit.allowed) {
    return {
      success: false,
      error: "Too many requests recently. Please wait and try again.",
    };
  }

  const validationError = validateInput(normalized);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const requestId = createTicketRequestId();
  const request = {
    id: requestId,
    fullName: normalized.fullName.trim(),
    email: normalized.email.trim().toLowerCase(),
    phone: normalized.phone.trim(),
    tripType: normalized.tripType,
    origin: normalized.origin.trim(),
    destination: normalized.destination.trim(),
    departureDate: normalized.departureDate,
    returnDate: normalized.tripType === "round-trip" ? normalized.returnDate : undefined,
    passengers: Math.round(normalized.passengers),
    cabinClass: normalized.cabinClass,
    flexibleDates: normalized.flexibleDates,
    notes: normalized.notes?.trim() || undefined,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveTicketRequest(request);

    try {
      await sendTicketRequestEmails(request);
    } catch {
      // Saved; email alert failure is non-blocking.
    }

    return { success: true, requestId };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[submitTicketRequest]", error);
    }

    return {
      success: false,
      error: "Could not submit your request right now. Please try again or call us.",
    };
  }
}
