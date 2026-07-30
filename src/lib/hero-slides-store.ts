import { cache } from "react";
import {
  DEFAULT_HERO_SLIDE_IDS,
  fallbackHeroSlides,
  normalizeHeroCtas,
  type AdminHeroSlide,
  type HeroSlide,
  type HeroSlideInput,
} from "@/lib/hero-slides";
import { isDatabaseConfigured } from "@/lib/db/config";
import { databaseSetupError, isMissingTableError } from "@/lib/db/errors";
import { getSql } from "@/lib/db/postgres";
import { normalizeMediaUrl } from "@/lib/media-url";

function rowToAdminSlide(row: Record<string, unknown>): AdminHeroSlide {
  return {
    id: row.id as string,
    imageUrl: normalizeMediaUrl((row.image_url as string) ?? ""),
    imageAlt: (row.image_alt as string) ?? "",
    eyebrow: (row.eyebrow as string) ?? "",
    headline: (row.headline as string) ?? "",
    body: (row.body as string) ?? "",
    ctas: normalizeHeroCtas(row.ctas),
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
    updatedAt: row.updated_at as string,
  };
}

function toPublicSlide(slide: AdminHeroSlide): HeroSlide {
  return {
    imageUrl: slide.imageUrl,
    imageAlt: slide.imageAlt,
    eyebrow: slide.eyebrow,
    headline: slide.headline,
    body: slide.body,
    ctas: slide.ctas,
  };
}

function fallbackSlides(): HeroSlide[] {
  return fallbackHeroSlides.map((slide) => ({
    ...slide,
    imageUrl: normalizeMediaUrl(slide.imageUrl),
    ctas: slide.ctas.map((cta) => ({ ...cta })),
  }));
}

export const getPublishedHeroSlides = cache(async (): Promise<HeroSlide[]> => {
  if (!isDatabaseConfigured()) return fallbackSlides();

  try {
    const sql = getSql();
    const rows = await sql`
      select * from public.hero_slides
      where is_active = true
      order by sort_order asc, updated_at desc
    `;

    if (!rows.length) return fallbackSlides();
    return rows.map((row) => toPublicSlide(rowToAdminSlide(row)));
  } catch {
    return fallbackSlides();
  }
});

export async function listAdminHeroSlides(): Promise<AdminHeroSlide[]> {
  const sql = getSql();
  try {
    const rows = await sql`
      select * from public.hero_slides
      order by sort_order asc, updated_at desc
    `;
    return rows.map((row) => rowToAdminSlide(row));
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function seedDefaultHeroSlidesIfEmpty(): Promise<number> {
  const sql = getSql();

  try {
    const countRows = await sql<{ count: string }[]>`
      select count(*)::text as count from public.hero_slides
    `;
    const count = Number(countRows[0]?.count ?? 0);
    if (count > 0) return 0;

    for (const [index, slide] of fallbackHeroSlides.entries()) {
      await sql`
        insert into public.hero_slides (
          id, image_url, image_alt, eyebrow, headline, body, ctas, sort_order, is_active
        ) values (
          ${DEFAULT_HERO_SLIDE_IDS[index] ?? null}::uuid,
          ${slide.imageUrl},
          ${slide.imageAlt},
          ${slide.eyebrow},
          ${slide.headline},
          ${slide.body},
          ${sql.json(slide.ctas)},
          ${index + 1},
          true
        )
        on conflict (id) do update set
          image_url = excluded.image_url,
          image_alt = excluded.image_alt,
          eyebrow = excluded.eyebrow,
          headline = excluded.headline,
          body = excluded.body,
          ctas = excluded.ctas,
          sort_order = excluded.sort_order,
          is_active = excluded.is_active,
          updated_at = now()
      `;
    }

    return fallbackHeroSlides.length;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}

export async function syncHeroSlides(inputs: HeroSlideInput[]): Promise<number> {
  const sql = getSql();

  try {
    await sql.begin(async (tx) => {
      const existing = await tx<{ id: string }[]>`
        select id from public.hero_slides
      `;
      const keepIds = new Set(
        inputs.map((slide) => slide.id).filter((id): id is string => Boolean(id)),
      );

      for (const row of existing) {
        if (!keepIds.has(row.id)) {
          await tx`delete from public.hero_slides where id = ${row.id}::uuid`;
        }
      }

      for (const [index, input] of inputs.entries()) {
        const imageUrl = input.imageUrl.trim();
        const imageAlt = input.imageAlt.trim();
        const eyebrow = input.eyebrow.trim();
        const headline = input.headline.trim();
        const body = input.body.trim();
        const sortOrder = index + 1;
        const isActive = input.isActive;
        const ctas = input.ctas;

        if (input.id) {
          await tx`
            update public.hero_slides
            set
              image_url = ${imageUrl},
              image_alt = ${imageAlt},
              eyebrow = ${eyebrow},
              headline = ${headline},
              body = ${body},
              ctas = ${tx.json(ctas)},
              sort_order = ${sortOrder},
              is_active = ${isActive},
              updated_at = now()
            where id = ${input.id}::uuid
          `;
        } else {
          await tx`
            insert into public.hero_slides (
              image_url, image_alt, eyebrow, headline, body, ctas, sort_order, is_active
            ) values (
              ${imageUrl},
              ${imageAlt},
              ${eyebrow},
              ${headline},
              ${body},
              ${tx.json(ctas)},
              ${sortOrder},
              ${isActive}
            )
          `;
        }
      }
    });

    return inputs.length;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}
