import {
  normalizeHtmlImageUrls,
  normalizeMediaUrl,
} from "@/lib/media-url";
import { staticBlogPosts } from "@/lib/seed-data";
import { getDatabaseUrl } from "./db-url";
import { loadLocalEnv } from "./load-env";
import { createPostgresClient } from "./postgres-client";
import { resolveBlogImageUrl } from "./upload-blog-images";

loadLocalEnv();

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80";

async function urlIsReachable(url: string) {
  if (url.startsWith("/")) return true;
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function resolveReachableImage(image: string, seedImage?: string) {
  let nextUrl = normalizeMediaUrl(image);

  if (await urlIsReachable(nextUrl)) {
    return nextUrl;
  }

  if (seedImage?.startsWith("/images/blog/")) {
    try {
      const uploaded = await resolveBlogImageUrl(seedImage);
      nextUrl = normalizeMediaUrl(uploaded);
      if (await urlIsReachable(nextUrl)) {
        return nextUrl;
      }
    } catch {
      // Fall through to public path or default image.
    }
  }

  if (seedImage) {
    nextUrl = normalizeMediaUrl(seedImage);
    if (await urlIsReachable(nextUrl)) {
      return nextUrl;
    }
  }

  return normalizeMediaUrl(DEFAULT_FALLBACK);
}

async function fixBlogImages(sql: ReturnType<typeof createPostgresClient>) {
  const seedBySlug = new Map(staticBlogPosts.map((post) => [post.slug, post]));
  const posts = await sql<
    { id: string; slug: string; image: string; body_html: string | null }[]
  >`select id, slug, image, body_html from public.blog_posts`;

  let updated = 0;

  for (const post of posts) {
    const seed = seedBySlug.get(post.slug);
    const nextImage = await resolveReachableImage(post.image, seed?.image);
    const nextBody = post.body_html
      ? normalizeHtmlImageUrls(String(post.body_html))
      : post.body_html;

    if (post.image === nextImage && post.body_html === nextBody) continue;

    await sql`
      update public.blog_posts
      set
        image = ${nextImage},
        body_html = ${nextBody ?? post.body_html},
        updated_at = now()
      where id = ${post.id}::uuid
    `;

    updated += 1;
    console.log(`Updated ${post.slug}`);
  }

  console.log(`Done. Updated ${updated} blog posts.`);
}

async function fixTourImages(sql: ReturnType<typeof createPostgresClient>) {
  const tours = await sql<
    { id: string; slug: string; image: string; gallery: string[] | null }[]
  >`select id, slug, image, gallery from public.tours`;

  let updated = 0;

  for (const tour of tours) {
    const nextImage = normalizeMediaUrl(tour.image);
    const gallery = Array.isArray(tour.gallery)
      ? tour.gallery.map((url) => normalizeMediaUrl(url))
      : [];

    if (tour.image === nextImage && JSON.stringify(tour.gallery) === JSON.stringify(gallery)) {
      continue;
    }

    await sql`
      update public.tours
      set image = ${nextImage}, gallery = ${sql.json(gallery)}, updated_at = now()
      where id = ${tour.id}::uuid
    `;

    updated += 1;
    console.log(`Updated tour ${tour.slug}`);
  }

  console.log(`Done. Updated ${updated} tours.`);
}

async function main() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required in .env.local");
  }

  const sql = createPostgresClient(databaseUrl);
  try {
    await fixBlogImages(sql);
    await fixTourImages(sql);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
