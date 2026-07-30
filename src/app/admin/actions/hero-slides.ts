"use server";

import { revalidatePath } from "next/cache";
import {
  isHeroCtaStyle,
  type HeroCta,
  type HeroSlideInput,
} from "@/lib/hero-slides";
import {
  seedDefaultHeroSlidesIfEmpty,
  syncHeroSlides,
} from "@/lib/hero-slides-store";
import { requireAdmin } from "@/lib/auth/staff";

export type HeroSlidesActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

function parseCtas(raw: unknown, slideIndex: number): { ctas: HeroCta[] } | { error: string } {
  if (!Array.isArray(raw)) {
    return { error: `Slide ${slideIndex + 1}: CTAs must be a list.` };
  }
  if (raw.length > 3) {
    return { error: `Slide ${slideIndex + 1}: at most 3 CTAs allowed.` };
  }

  const ctas: HeroCta[] = [];
  for (const [ctaIndex, item] of raw.entries()) {
    if (!item || typeof item !== "object") {
      return { error: `Slide ${slideIndex + 1}, CTA ${ctaIndex + 1}: invalid entry.` };
    }
    const record = item as Record<string, unknown>;
    const label = String(record.label ?? "").trim();
    const href = String(record.href ?? "").trim();
    const styleRaw = String(record.style ?? "secondary").trim();

    if (!label && !href) continue;
    if (!label || !href) {
      return {
        error: `Slide ${slideIndex + 1}, CTA ${ctaIndex + 1}: label and link are both required.`,
      };
    }
    if (!isHeroCtaStyle(styleRaw)) {
      return {
        error: `Slide ${slideIndex + 1}, CTA ${ctaIndex + 1}: style must be primary or secondary.`,
      };
    }

    ctas.push({ label, href, style: styleRaw });
  }

  return { ctas };
}

function parseSlidesPayload(formData: FormData):
  | { inputs: HeroSlideInput[] }
  | { error: string } {
  const raw = String(formData.get("slides") ?? "").trim();
  if (!raw) return { error: "No slides submitted." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Invalid slides payload." };
  }

  if (!Array.isArray(parsed)) return { error: "Slides payload must be an array." };
  if (parsed.length === 0) return { error: "Add at least one slide before saving." };

  const inputs: HeroSlideInput[] = [];

  for (const [index, item] of parsed.entries()) {
    if (!item || typeof item !== "object") {
      return { error: `Slide ${index + 1} is invalid.` };
    }
    const record = item as Record<string, unknown>;
    const id = String(record.id ?? "").trim() || undefined;
    const imageUrl = String(record.imageUrl ?? "").trim();
    const imageAlt = String(record.imageAlt ?? "").trim();
    const eyebrow = String(record.eyebrow ?? "").trim();
    const headline = String(record.headline ?? "").trim();
    const body = String(record.body ?? "").trim();
    const isActive = Boolean(record.isActive);
    const ctasResult = parseCtas(record.ctas, index);
    if ("error" in ctasResult) return ctasResult;

    if (isActive) {
      if (!imageUrl) return { error: `Slide ${index + 1}: image is required for active slides.` };
      if (!headline) return { error: `Slide ${index + 1}: headline is required for active slides.` };
    } else if (!headline && !imageUrl) {
      return { error: `Slide ${index + 1}: add an image or headline, or remove the slide.` };
    }

    inputs.push({
      id,
      imageUrl,
      imageAlt,
      eyebrow,
      headline: headline || "Untitled slide",
      body,
      ctas: ctasResult.ctas,
      sortOrder: index + 1,
      isActive,
    });
  }

  return { inputs };
}

export async function saveHeroSlidesAction(
  _prev: HeroSlidesActionResult | undefined,
  formData: FormData,
): Promise<HeroSlidesActionResult> {
  try {
    await requireAdmin();
    const parsed = parseSlidesPayload(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    const count = await syncHeroSlides(parsed.inputs);
    revalidatePath("/");
    revalidatePath("/admin/hero");
    return {
      success: true,
      message: `Saved ${count} hero slide${count === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save hero slides.",
    };
  }
}

export async function importDefaultHeroSlidesAction(
  prev: HeroSlidesActionResult | undefined,
  formData: FormData,
): Promise<HeroSlidesActionResult> {
  void prev;
  void formData;
  try {
    await requireAdmin();
    const imported = await seedDefaultHeroSlidesIfEmpty();
    revalidatePath("/");
    revalidatePath("/admin/hero");
    if (imported === 0) {
      return { success: true, message: "Hero slides are already in the database." };
    }
    return {
      success: true,
      message: `Imported ${imported} hero slide${imported === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not import hero slides.",
    };
  }
}
