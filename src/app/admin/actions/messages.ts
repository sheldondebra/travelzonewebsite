"use server";

import { revalidatePath } from "next/cache";
import type { ContactMessageStatus } from "@/lib/contact-messages";
import { updateContactMessageStatus } from "@/lib/contact-messages-store";
import { requireAdmin } from "@/lib/supabase/auth";

export async function updateContactMessageStatusAction(
  id: string,
  status: ContactMessageStatus,
) {
  await requireAdmin();

  try {
    await updateContactMessageStatus(id, status);
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${id}`);
    return { success: true as const, message: "Message status updated." };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}
