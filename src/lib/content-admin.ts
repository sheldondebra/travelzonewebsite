import type { AdminTour, ContentStatus, TourInput } from "@/lib/content-types";
import { databaseSetupError, isMissingTableError } from "@/lib/db/errors";
import { getSql } from "@/lib/db/postgres";
import { normalizeMediaUrl, normalizeMediaUrls } from "@/lib/media-url";
import type { Tour } from "@/lib/tours";

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

function rowToAdminTour(row: Record<string, unknown>): AdminTour {
  return {
    ...rowToTour(row),
    id: row.id as string,
    status: row.status as ContentStatus,
    updatedAt: row.updated_at as string,
  };
}

export async function listAdminTours(): Promise<AdminTour[]> {
  const sql = getSql();
  try {
    const rows = await sql`select * from public.tours order by updated_at desc`;
    return rows.map((row) => rowToAdminTour(row));
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function getAdminTour(id: string): Promise<AdminTour | null> {
  const sql = getSql();
  try {
    const rows = await sql`select * from public.tours where id = ${id}::uuid limit 1`;
    return rows[0] ? rowToAdminTour(rows[0]) : null;
  } catch (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
}

export async function saveTour(
  input: TourInput,
  options: { id?: string; authorId: string },
) {
  const sql = getSql();
  const publishedAt =
    input.status === "published" ? new Date().toISOString() : null;

  try {
    if (options.id) {
      await sql`
        update public.tours set
          slug = ${input.slug},
          title = ${input.title},
          tagline = ${input.tagline},
          location = ${input.location},
          duration = ${input.duration},
          price = ${input.price},
          currency = ${input.currency},
          price_note = ${input.priceNote},
          travel_period = ${input.travelPeriod},
          image = ${input.image},
          gallery = ${sql.json(input.gallery)},
          description = ${input.description},
          overview = ${sql.json(input.overview)},
          highlights = ${sql.json(input.highlights)},
          included = ${sql.json(input.included)},
          category = ${input.category},
          status = ${input.status},
          author_id = ${options.authorId}::uuid,
          published_at = case
            when ${input.status} = 'published' then coalesce(published_at, ${publishedAt}::timestamptz)
            else null
          end,
          updated_at = now()
        where id = ${options.id}::uuid
      `;
      return options.id;
    }

    const rows = await sql<{ id: string }[]>`
      insert into public.tours (
        slug, title, tagline, location, duration, price, currency,
        price_note, travel_period, image, gallery, description,
        overview, highlights, included, category, status, author_id, published_at
      ) values (
        ${input.slug},
        ${input.title},
        ${input.tagline},
        ${input.location},
        ${input.duration},
        ${input.price},
        ${input.currency},
        ${input.priceNote},
        ${input.travelPeriod},
        ${input.image},
        ${sql.json(input.gallery)},
        ${input.description},
        ${sql.json(input.overview)},
        ${sql.json(input.highlights)},
        ${sql.json(input.included)},
        ${input.category},
        ${input.status},
        ${options.authorId}::uuid,
        ${publishedAt}::timestamptz
      )
      returning id
    `;
    return rows[0].id;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}

export async function deleteTour(id: string) {
  const sql = getSql();
  try {
    await sql`delete from public.tours where id = ${id}::uuid`;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}

export async function updateTourStatus(id: string, status: ContentStatus) {
  const sql = getSql();
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  try {
    await sql`
      update public.tours
      set
        status = ${status},
        published_at = case
          when ${status} = 'published' then coalesce(published_at, ${publishedAt}::timestamptz)
          else published_at
        end,
        updated_at = now()
      where id = ${id}::uuid
    `;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}
