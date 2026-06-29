"use server";

import { revalidatePath } from "next/cache";
import type { TicketRequestStatus } from "@/lib/ticket-requests";
import { updateTicketRequestStatus } from "@/lib/ticket-requests-store";
import { requireAdmin } from "@/lib/supabase/auth";

export type TicketRequestActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function updateTicketRequestStatusAction(
  id: string,
  status: TicketRequestStatus,
): Promise<TicketRequestActionResult> {
  await requireAdmin();

  try {
    await updateTicketRequestStatus(id, status);
    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${id}`);
    return { success: true, message: "Ticket request updated." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}
