"use server";

import type { ContactMessageInput, ContactMessageResult } from "@/lib/contact-messages";
import { isContactSubject } from "@/lib/contact-messages";
import {
  createContactMessageId,
  saveContactMessage,
} from "@/lib/contact-messages-store";
import { sendContactMessageEmails } from "@/lib/email";

function validateInput(input: ContactMessageInput): string | null {
  if (!input.name.trim()) return "Full name is required.";

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

  if (!isContactSubject(input.subject)) {
    return "Please select a topic.";
  }

  const message = input.message.trim();
  if (!message) return "Message is required.";
  if (message.length < 10) {
    return "Message should be at least 10 characters.";
  }

  return null;
}

export async function submitContactMessage(
  input: ContactMessageInput,
): Promise<ContactMessageResult> {
  const validationError = validateInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const messageId = createContactMessageId();
  const message = {
    id: messageId,
    fullName: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    subject: input.subject,
    message: input.message.trim(),
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveContactMessage(message);

    try {
      await sendContactMessageEmails(message);
    } catch {
      // Saved; email alert failure is non-blocking.
    }

    return { success: true, messageId };
  } catch {
    return {
      success: false,
      error: "Could not send your message right now. Please try again or call us.",
    };
  }
}
