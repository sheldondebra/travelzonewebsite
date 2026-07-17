import "server-only";

import { cache } from "react";
import type { BlogPost } from "@/lib/content";
import type { Tour } from "@/lib/tours";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSql } from "@/lib/db/postgres";
import { withQueryTimeout } from "@/lib/db/query-with-timeout";
import { normalizeMediaUrl, normalizeMediaUrls } from "@/lib/media-url";
import { sanitizeBlogHtml } from "@/lib/sanitize-html";
import { staticBlogPosts, staticTours } from "@/lib/seed-data";

function withNormalizedBlogImage<T extends { image: string }>(post: T): T {
  return { ...post, image: normalizeMediaUrl(post.image) };
}

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

function staticBlogPostList(): BlogPost[] {
  return staticBlogPosts.map((post) =>
    withNormalizedBlogImage({
      ...post,
      content: [],
      bodyHtml: undefined,
    }),
  );
}

function rowToBlogPostListItem(row: Record<string, unknown>): BlogPost | null {
  try {
    const slug = String(row.slug ?? "").trim();
    const title = String(row.title ?? "").trim();
    if (!slug || !title) return null;

    return {
      slug,
      title,
      excerpt: String(row.excerpt ?? ""),
      content: [],
      image: normalizeMediaUrl(String(row.image ?? "")),
      date: String(row.display_date ?? ""),
      category: String(row.category ?? ""),
      readTime: String(row.read_time ?? "5 min read"),
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
    };
  } catch {
    return null;
  }
}

function rowToBlogPost(row: Record<string, unknown>): BlogPost {
  const bodyHtml = sanitizeBlogHtml((row.body_html as string) ?? "");
  return {
    slug: row.slug as string,
    title: row.title as string,
    excerpt: (row.excerpt as string) ?? "",
    bodyHtml,
    content: htmlToParagraphs(bodyHtml),
    image: normalizeMediaUrl((row.image as string) ?? ""),
    date: (row.display_date as string) ?? "",
    category: (row.category as string) ?? "",
    readTime: (row.read_time as string) ?? "5 min read",
    updatedAt: (row.updated_at as string) ?? undefined,
  };
}

export function htmlToParagraphs(html: string): string[] {
  if (!html.trim()) return [];
  const matches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (!matches) return [html.replace(/<[^>]+>/g, "")];
  return matches.map((block) =>
    block.replace(/<\/?p[^>]*>/gi, "").replace(/<[^>]+>/g, "").trim(),
  );
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
    const sql = getSql();
    const rows = await sql`
      select slug, title, tagline, location, duration, price, currency,
             price_note, travel_period, image, category
      from public.tours
      where status = 'published'
      order by updated_at desc
    `;

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
    const sql = getSql();
    const rows = await sql`
      select * from public.tours
      where slug = ${slug} and status = 'published'
      limit 1
    `;

    if (!rows[0]) {
      const tour = staticTours.find((t) => t.slug === slug);
      return tour ? normalizeTourMedia(tour) : null;
    }

    return rowToTour(rows[0]);
  } catch {
    const tour = staticTours.find((t) => t.slug === slug);
    return tour ? normalizeTourMedia(tour) : null;
  }
}

async function loadPublishedBlogPosts(): Promise<BlogPost[]> {
  const fallback = staticBlogPostList();
  if (!isDatabaseConfigured()) return fallback;

  try {
    const rows = await withQueryTimeout(
      (async () => {
        const sql = getSql();
        return sql`
          select slug, title, excerpt, image, display_date, category,
                 read_time, updated_at, published_at
          from public.blog_posts
          where status = 'published'
          order by published_at desc nulls last
        `;
      })(),
      [] as Record<string, unknown>[],
    );

    if (!rows.length) return fallback;

    const posts = rows
      .map((row) => rowToBlogPostListItem(row))
      .filter((post): post is BlogPost => post !== null);

    return posts.length > 0 ? posts : fallback;
  } catch {
    return fallback;
  }
}

async function loadBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const fallback = staticBlogPosts.find((p) => p.slug === slug);
  const fallbackPost = fallback ? withNormalizedBlogImage(fallback) : null;

  if (!isDatabaseConfigured()) return fallbackPost;

  try {
    const row = await withQueryTimeout(
      (async () => {
        const sql = getSql();
        const rows = await sql`
          select * from public.blog_posts
          where slug = ${slug} and status = 'published'
          limit 1
        `;
        return rows[0] ?? null;
      })(),
      null as Record<string, unknown> | null,
    );

    if (!row) return fallbackPost;

    try {
      return rowToBlogPost(row);
    } catch {
      return fallbackPost;
    }
  } catch {
    return fallbackPost;
  }
}

export const getPublishedTours = cache(loadPublishedTours);
export const getTourBySlug = cache(loadTourBySlug);
export const getPublishedBlogPosts = cache(loadPublishedBlogPosts);
export const getBlogPostBySlug = cache(loadBlogPostBySlug);
