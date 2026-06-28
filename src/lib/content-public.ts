import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { cache } from "react";
import type { BlogPost } from "@/lib/content";
import type { Tour } from "@/lib/tours";
import { normalizeBlogImageUrl } from "@/lib/blog-images";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";
import { staticBlogPosts, staticTours } from "@/lib/seed-data";

function withNormalizedBlogImage<T extends { image: string }>(post: T): T {
  return { ...post, image: normalizeBlogImageUrl(post.image) };
}

function anonClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase not configured");
  return createSupabaseJs(env.url, env.anonKey);
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
    image: (row.image as string) ?? "",
    gallery: asStringArray(row.gallery),
    description: (row.description as string) ?? "",
    overview: asStringArray(row.overview),
    highlights: asStringArray(row.highlights),
    included: asStringArray(row.included),
    category: (row.category as string) ?? "",
  };
}

function rowToBlogPost(row: Record<string, unknown>): BlogPost {
  const bodyHtml = (row.body_html as string) ?? "";
  return {
    slug: row.slug as string,
    title: row.title as string,
    excerpt: (row.excerpt as string) ?? "",
    bodyHtml,
    content: htmlToParagraphs(bodyHtml),
    image: normalizeBlogImageUrl((row.image as string) ?? ""),
    date: (row.display_date as string) ?? "",
    category: (row.category as string) ?? "",
    readTime: (row.read_time as string) ?? "5 min read",
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

async function loadPublishedTours(): Promise<Tour[]> {
  if (!isSupabaseConfigured()) return staticTours;

  const { data, error } = await anonClient()
    .from("tours")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error || !data?.length) return staticTours;
  return data.map((row) => rowToTour(row));
}

async function loadTourBySlug(slug: string): Promise<Tour | null> {
  if (!isSupabaseConfigured()) {
    return staticTours.find((t) => t.slug === slug) ?? null;
  }

  const { data, error } = await anonClient()
    .from("tours")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return staticTours.find((t) => t.slug === slug) ?? null;
  }
  return rowToTour(data);
}

async function loadPublishedBlogPosts(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) {
    return staticBlogPosts.map(withNormalizedBlogImage);
  }

  const { data, error } = await anonClient()
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data?.length) {
    return staticBlogPosts.map(withNormalizedBlogImage);
  }
  return data.map((row) => rowToBlogPost(row));
}

async function loadBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) {
    const post = staticBlogPosts.find((p) => p.slug === slug);
    return post ? withNormalizedBlogImage(post) : null;
  }

  const { data, error } = await anonClient()
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    const post = staticBlogPosts.find((p) => p.slug === slug);
    return post ? withNormalizedBlogImage(post) : null;
  }
  return rowToBlogPost(data);
}

export const getPublishedTours = cache(loadPublishedTours);

export const getTourBySlug = cache(loadTourBySlug);

export const getPublishedBlogPosts = cache(loadPublishedBlogPosts);

export const getBlogPostBySlug = cache(loadBlogPostBySlug);
