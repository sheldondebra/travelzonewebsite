import { contactInfo } from "@/lib/content";
import type { NotificationSettings } from "@/lib/settings-types";

export function getAdminNotificationEmails(notifications: NotificationSettings) {
  const fromSettings = notifications.emailOnBookingPaidTo
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (fromSettings.length > 0) return fromSettings;
  return [contactInfo.email];
}
