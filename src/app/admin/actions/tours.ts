"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteTour,
  saveTour,
  updateTourStatus,
} from "@/lib/content-admin";
import type { ContentStatus, TourInput } from "@/lib/content-types";
import { normalizeMediaUrl, normalizeMediaUrls } from "@/lib/media-url";
import { slugify } from "@/lib/slugify";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";

export type TourActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

function parseTourForm(formData: FormData): TourInput {
  return {
    slug: slugify(String(formData.get("slug") ?? formData.get("title") ?? "")),
    title: String(formData.get("title") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    location: String(formData.get("location") ?? ""),
    duration: String(formData.get("duration") ?? ""),
    price: Number(formData.get("price") ?? 0),
    currency: (formData.get("currency") as "USD" | "GHS") ?? "USD",
    priceNote: String(formData.get("priceNote") ?? ""),
    travelPeriod: String(formData.get("travelPeriod") ?? ""),
    image: normalizeMediaUrl(String(formData.get("image") ?? "")),
    gallery: normalizeMediaUrls(
      JSON.parse(String(formData.get("gallery") ?? "[]")) as string[],
    ),
    description: String(formData.get("description") ?? ""),
    overview: JSON.parse(String(formData.get("overview") ?? "[]")) as string[],
    highlights: JSON.parse(
      String(formData.get("highlights") ?? "[]"),
    ) as string[],
    included: JSON.parse(String(formData.get("included") ?? "[]")) as string[],
    category: String(formData.get("category") ?? ""),
    status: (formData.get("status") as ContentStatus) ?? "draft",
  };
}

export async function saveTourAction(
  _prev: { success: false; error: string } | undefined,
  formData: FormData,
) {
  const { user } = await requireStaff();
  const id = String(formData.get("id") ?? "") || undefined;
  const tour = parseTourForm(formData);

  if (!tour.slug || !tour.title) {
    return { success: false as const, error: "Title and slug are required." };
  }

  try {
    const savedId = await saveTour(tour, {
      id,
      authorId: user.id,
    });
    revalidatePath("/");
    revalidatePath("/tours");
    revalidatePath(`/tours/${tour.slug}`);
    revalidatePath("/admin/tours");
    redirect(`/admin/tours/${savedId}/edit?saved=1`);
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not save tour.",
    };
  }
}

export async function updateTourStatusAction(
  _prev: TourActionResult | undefined,
  formData: FormData,
): Promise<TourActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ContentStatus;

  if (!id) {
    return { success: false, error: "Tour not found." };
  }

  if (status !== "draft" && status !== "published") {
    return { success: false, error: "Invalid status." };
  }

  try {
    await updateTourStatus(id, status);
    revalidatePath("/");
    revalidatePath("/tours");
    revalidatePath("/admin/tours");
    return {
      success: true,
      message: status === "published" ? "Tour published." : "Tour switched to draft.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update tour.",
    };
  }
}

export async function deleteTourFormAction(
  _prev: TourActionResult | undefined,
  formData: FormData,
): Promise<TourActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { success: false, error: "Tour not found." };
  }

  try {
    await deleteTour(id);
    revalidatePath("/");
    revalidatePath("/tours");
    revalidatePath("/admin/tours");
    return { success: true, message: "Tour deleted." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete tour.",
    };
  }
}

export async function deleteTourAction(id: string) {
  await requireAdmin();
  await deleteTour(id);
  revalidatePath("/");
  revalidatePath("/tours");
  revalidatePath("/admin/tours");
  redirect("/admin/tours");
}
