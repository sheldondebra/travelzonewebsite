"use server";

import { revalidatePath } from "next/cache";
import type { ConsultationStatus } from "@/lib/consultations";
import { parseAvailabilityFormData } from "@/lib/consultation-availability";
import { updateConsultationStatus } from "@/lib/consultations-store";
import { saveConsultationAvailabilitySettings } from "@/lib/site-settings";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";

export type ConsultationAvailabilityResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function saveConsultationAvailabilityAction(
  _prev: ConsultationAvailabilityResult | undefined,
  formData: FormData,
): Promise<ConsultationAvailabilityResult> {
  try {
    const { user } = await requireStaff();
    const availability = parseAvailabilityFormData(formData);
    await saveConsultationAvailabilitySettings(availability, user.id);
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/consultations");
    revalidatePath("/consultation");
    return { success: true, message: "Booking schedule saved." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save booking schedule.",
    };
  }
}

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
