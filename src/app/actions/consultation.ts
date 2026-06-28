"use server";

import type { ConsultationInput, ConsultationResult } from "@/lib/consultations";
import {
  consultationModes,
  consultationTimeSlots,
  consultationTopics,
  isConsultationDateSelectable,
  isConsultationTimeSelectable,
} from "@/lib/consultations";
import {
  createConsultationId,
  saveConsultation,
} from "@/lib/consultations-store";
import { sendConsultationBookingEmails } from "@/lib/email";

function validateInput(input: ConsultationInput): string | null {
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
  if (!isConsultationDateSelectable(input.preferredDate)) {
    return "Choose a weekday or Saturday — we are closed on Sundays.";
  }

  if (
    !consultationTimeSlots.some((slot) => slot.value === input.preferredTime)
  ) {
    return "Please select a valid time slot.";
  }

  if (!isConsultationTimeSelectable(input.preferredDate, input.preferredTime)) {
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
  const validationError = validateInput(input);
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
