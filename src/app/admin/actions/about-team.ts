"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteAboutTeamMember,
  saveAboutTeamMember,
  updateAboutTeamMemberStatus,
} from "@/lib/about-team-store";
import type { ContentStatus } from "@/lib/content-types";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";

export type AboutTeamActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

function parseMemberForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const status = String(formData.get("status") ?? "draft") as ContentStatus;

  if (!name) return { error: "Name is required." as const };
  if (!role) return { error: "Role is required." as const };
  if (!image) return { error: "Photo is required." as const };
  if (status !== "draft" && status !== "published") {
    return { error: "Invalid status." as const };
  }

  return {
    input: {
      name,
      role,
      bio,
      image,
      sortOrder: Number.isFinite(sortOrder) ? Math.max(0, Math.round(sortOrder)) : 0,
      status,
    },
  };
}

export async function saveAboutTeamMemberAction(
  _prev: AboutTeamActionResult | undefined,
  formData: FormData,
): Promise<AboutTeamActionResult> {
  try {
    await requireStaff();
    const parsed = parseMemberForm(formData);
    if ("error" in parsed) return { success: false, error: parsed.error! };

    const id = String(formData.get("id") ?? "").trim() || undefined;
    const savedId = await saveAboutTeamMember(parsed.input, { id });
    revalidatePath("/admin/about");
    revalidatePath("/about");
    if (id) {
      revalidatePath(`/admin/about/${id}/edit`);
      return { success: true, message: "Team member updated." };
    }

    redirect(`/admin/about/${savedId}/edit?saved=1`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save team member.",
    };
  }
}

export async function updateAboutTeamMemberStatusAction(
  _prev: AboutTeamActionResult | undefined,
  formData: FormData,
): Promise<AboutTeamActionResult> {
  try {
    await requireStaff();
    const id = String(formData.get("id") ?? "").trim();
    const status = String(formData.get("status") ?? "") as ContentStatus;
    if (!id) return { success: false, error: "Missing team member id." };
    if (status !== "draft" && status !== "published") {
      return { success: false, error: "Invalid status." };
    }

    await updateAboutTeamMemberStatus(id, status);
    revalidatePath("/admin/about");
    revalidatePath("/about");
    return {
      success: true,
      message: status === "published" ? "Team member published." : "Team member unpublished.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function deleteAboutTeamMemberFormAction(
  _prev: AboutTeamActionResult | undefined,
  formData: FormData,
): Promise<AboutTeamActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { success: false, error: "Missing team member id." };

    await deleteAboutTeamMember(id);
    revalidatePath("/admin/about");
    revalidatePath("/about");
    return { success: true, message: "Team member deleted." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed.",
    };
  }
}
