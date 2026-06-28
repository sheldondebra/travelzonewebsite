"use server";

import { revalidatePath } from "next/cache";
import type { ConsultationStatus } from "@/lib/consultations";
import { updateConsultationStatus } from "@/lib/consultations-store";
import { requireAdmin } from "@/lib/supabase/auth";

export async function updateConsultationStatusAction(
  id: string,
  status: ConsultationStatus,
) {
  await requireAdmin();

  try {
    await updateConsultationStatus(id, status);
    revalidatePath("/admin/consultations");
    revalidatePath(`/admin/consultations/${id}`);
    return { success: true as const, message: "Consultation status updated." };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}
