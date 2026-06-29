"use server";

import type { ConsultationInput, ConsultationResult } from "@/lib/consultations";
import {
  consultationModes,
  consultationTopics,
  isConsultationDateSelectable,
  isConsultationTimeSelectable,
  isValidConsultationTime,
} from "@/lib/consultations";
import {
  createConsultationId,
  saveConsultation,
} from "@/lib/consultations-store";
import { sendConsultationBookingEmails } from "@/lib/email";
import { rateLimitFromHeaders } from "@/lib/rate-limit";
import { getConsultationAvailability } from "@/lib/site-settings";

async function validateInput(input: ConsultationInput): Promise<string | null> {
  const availability = await getConsultationAvailability();

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

  if (!input.preferredDate) return "Please select a preferred date.";
  if (!isConsultationDateSelectable(input.preferredDate, availability)) {
    return "That date is not available. Please choose another day.";
  }

  if (!isValidConsultationTime(input.preferredTime, availability)) {
    return "Please select a valid time slot.";
  }

  if (!isConsultationTimeSelectable(input.preferredDate, input.preferredTime, availability)) {
    return "That time is not available on the selected day.";
  }

  if (!consultationTopics.some((topic) => topic.value === input.topic)) {
    return "Please select a consultation topic.";
  }

  if (!consultationModes.some((mode) => mode.value === input.mode)) {
    return "Please select how you would like to meet.";
  }

  return null;
}

export async function bookConsultation(
  input: ConsultationInput,
): Promise<ConsultationResult> {
  const limit = await rateLimitFromHeaders("consultation-form", 5, 30 * 60 * 1000);
  if (!limit.allowed) {
    return {
      success: false,
      error: "Too many requests recently. Please wait and try again.",
    };
  }

  const validationError = await validateInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const bookingId = createConsultationId();
  const booking = {
    id: bookingId,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    topic: input.topic,
    mode: input.mode,
    notes: input.notes?.trim() || undefined,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveConsultation(booking);

    try {
      await sendConsultationBookingEmails(booking);
    } catch {
      // Saved; email alert failure is non-blocking.
    }

    return { success: true, bookingId };
  } catch {
    return {
      success: false,
      error: "Could not submit your request right now. Please try again or call us.",
    };
  }
}
