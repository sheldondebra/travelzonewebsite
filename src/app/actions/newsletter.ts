"use server";

import { saveNewsletterSubscriber } from "@/lib/newsletter-store";
import { sendNewsletterSignupEmail } from "@/lib/email";

export type SubscribeResult =
  | { success: true; alreadySubscribed: boolean }
  | { success: false; error: string };

export async function subscribeNewsletter(email: string): Promise<SubscribeResult> {
  const normalized = email.trim().toLowerCase();

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { success: false, error: "Please enter a valid email address." };
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
