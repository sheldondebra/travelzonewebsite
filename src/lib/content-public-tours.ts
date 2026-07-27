import "server-only";

import { cache } from "react";
import type { Tour } from "@/lib/tours";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSql } from "@/lib/db/postgres";
import { withQueryTimeout } from "@/lib/db/query-with-timeout";
import { normalizeMediaUrl, normalizeMediaUrls } from "@/lib/media-url";
import { staticTours } from "@/lib/seed-data";

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  return [];
}

function rowToTour(row: Record<string, unknown>): Tour {
  return {
    slug: row.slug as string,
    title: row.title as string,
    tagline: (row.tagline as string) ?? "",
    location: (row.location as string) ?? "",
    duration: (row.duration as string) ?? "",
    price: Number(row.price),
    currency: (row.currency as "USD" | "GHS") ?? "USD",
    priceNote: (row.price_note as string) ?? "",
    travelPeriod: (row.travel_period as string) ?? "",
    image: normalizeMediaUrl((row.image as string) ?? ""),
    gallery: normalizeMediaUrls(asStringArray(row.gallery)),
    description: (row.description as string) ?? "",
    overview: asStringArray(row.overview),
    highlights: asStringArray(row.highlights),
    included: asStringArray(row.included),
    category: (row.category as string) ?? "",
  };
}

function normalizeTourMedia(tour: Tour): Tour {
  return {
    ...tour,
    image: normalizeMediaUrl(tour.image),
    gallery: normalizeMediaUrls(tour.gallery),
  };
}

async function loadPublishedTours(): Promise<Tour[]> {
  if (!isDatabaseConfigured()) return staticTours.map(normalizeTourMedia);

  try {
    const rows = await withQueryTimeout(
      (async () => {
        const sql = getSql();
        return sql`
          select slug, title, tagline, location, duration, price, currency,
                 price_note, travel_period, image, category
          from public.tours
          where status = 'published'
          order by updated_at desc
        `;
      })(),
      [] as Record<string, unknown>[],
    );

    if (!rows.length) return staticTours.map(normalizeTourMedia);

    return rows.map((row) => ({
      ...rowToTour(row),
      gallery: [],
      description: "",
      overview: [],
      highlights: [],
      included: [],
    }));
  } catch {
    return staticTours.map(normalizeTourMedia);
  }
}

async function loadTourBySlug(slug: string): Promise<Tour | null> {
  if (!isDatabaseConfigured()) {
    const tour = staticTours.find((t) => t.slug === slug);
    return tour ? normalizeTourMedia(tour) : null;
  }

  try {
    const row = await withQueryTimeout(
      (async () => {
        const sql = getSql();
        const rows = await sql`
          select * from public.tours
          where slug = ${slug} and status = 'published'
          limit 1
        `;
        return rows[0] ?? null;
      })(),
      null as Record<string, unknown> | null,
    );

    if (!row) {
      const tour = staticTours.find((t) => t.slug === slug);
      return tour ? normalizeTourMedia(tour) : null;
    }

    return rowToTour(row);
  } catch {
    const tour = staticTours.find((t) => t.slug === slug);
    return tour ? normalizeTourMedia(tour) : null;
  }
}

export const getPublishedTours = cache(loadPublishedTours);
export const getTourBySlug = cache(loadTourBySlug);
