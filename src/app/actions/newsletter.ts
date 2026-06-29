"use server";

import { saveNewsletterSubscriber } from "@/lib/newsletter-store";
import { sendNewsletterSignupEmail } from "@/lib/email";
import { rateLimitFromHeaders } from "@/lib/rate-limit";

export type SubscribeResult =
  | { success: true; alreadySubscribed: boolean }
  | { success: false; error: string };

export async function subscribeNewsletter(email: string): Promise<SubscribeResult> {
  const normalized = email.trim().toLowerCase();

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const limit = await rateLimitFromHeaders(
    "newsletter",
    5,
    60 * 60 * 1000,
    normalized,
  );
  if (!limit.allowed) {
    return {
      success: false,
      error: "Too many signup attempts. Please try again later.",
    };
  }

  try {
    const result = await saveNewsletterSubscriber(normalized);

    if (!result.alreadySubscribed) {
      try {
        await sendNewsletterSignupEmail(normalized);
      } catch {
        // Subscription saved; email alert failure is non-blocking.
      }
    }

    return { success: true, alreadySubscribed: result.alreadySubscribed };
  } catch {
    return {
      success: false,
      error: "Could not subscribe right now. Please try again later.",
    };
  }
}
