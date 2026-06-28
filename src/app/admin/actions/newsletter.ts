"use server";

import { listNewsletterSubscribers } from "@/lib/newsletter-store";
import { requireStaff } from "@/lib/supabase/auth";

export async function exportNewsletterCsvAction() {
  await requireStaff();
  const subscribers = await listNewsletterSubscribers();

  const rows = ["email,subscribed_at", ...subscribers.map((s) => `${s.email},${s.createdAt}`)];
  return rows.join("\n");
}
