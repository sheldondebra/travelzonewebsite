"use server";

import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@/lib/bookings";
import { updateBookingStatus } from "@/lib/bookings-store";
import { requireAdmin } from "@/lib/supabase/auth";

export async function updateBookingStatusAction(
  id: string,
  status: BookingStatus,
) {
  await requireAdmin();

  try {
    await updateBookingStatus(id, status);
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);
    return { success: true as const, message: "Booking status updated." };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}
