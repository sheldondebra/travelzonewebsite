import "server-only";

import { cache } from "react";
import type { BlogPost } from "@/lib/content";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSql } from "@/lib/db/postgres";
import { withQueryTimeout } from "@/lib/db/query-with-timeout";
import { normalizeMediaUrl } from "@/lib/media-url";
import { sanitizeBlogHtml } from "@/lib/sanitize-html";
import { staticBlogPosts } from "@/lib/seed-data";
import { htmlToParagraphs } from "@/lib/content-public-html";

function withNormalizedBlogImage<T extends { image: string }>(post: T): T {
  return { ...post, image: normalizeMediaUrl(post.image) };
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
      updatedAt:
        row.updated_at != null
          ? String(row.updated_at)
          : undefined,
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
    updatedAt: row.updated_at != null ? String(row.updated_at) : undefined,
  };
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

export const getPublishedBlogPosts = cache(loadPublishedBlogPosts);
export const getBlogPostBySlug = cache(loadBlogPostBySlug);
