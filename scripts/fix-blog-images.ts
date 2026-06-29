import {
  normalizeHtmlImageUrls,
  normalizeMediaUrl,
} from "@/lib/media-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { staticBlogPosts } from "@/lib/seed-data";
import { loadLocalEnv } from "./load-env";
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

async function fixBlogImages() {
  const admin = createAdminClient();
  const seedBySlug = new Map(staticBlogPosts.map((post) => [post.slug, post]));
  const { data: posts, error } = await admin
    .from("blog_posts")
    .select("id, slug, image, body_html");

  if (error) throw new Error(error.message);

  let updated = 0;

  for (const post of posts ?? []) {
    const seed = seedBySlug.get(post.slug);
    const nextImage = await resolveReachableImage(post.image, seed?.image);
    const nextBody = post.body_html
      ? normalizeHtmlImageUrls(String(post.body_html))
      : post.body_html;

    if (post.image === nextImage && post.body_html === nextBody) continue;

    const { error: updateError } = await admin
      .from("blog_posts")
      .update({
        image: nextImage,
        ...(nextBody !== post.body_html ? { body_html: nextBody } : {}),
      })
      .eq("id", post.id);

    if (updateError) throw new Error(`${post.slug}: ${updateError.message}`);

    updated += 1;
    console.log(`Updated ${post.slug}`);
  }

  console.log(`Done. Updated ${updated} blog posts.`);
}

async function fixTourImages() {
  const admin = createAdminClient();
  const { data: tours, error } = await admin.from("tours").select("id, slug, image, gallery");

  if (error) throw new Error(error.message);

  let updated = 0;

  for (const tour of tours ?? []) {
    const nextImage = normalizeMediaUrl(tour.image);
    const gallery = Array.isArray(tour.gallery)
      ? tour.gallery.map((url: string) => normalizeMediaUrl(url))
      : [];

    if (tour.image === nextImage && JSON.stringify(tour.gallery) === JSON.stringify(gallery)) {
      continue;
    }

    const { error: updateError } = await admin
      .from("tours")
      .update({ image: nextImage, gallery })
      .eq("id", tour.id);

    if (updateError) throw new Error(`${tour.slug}: ${updateError.message}`);

    updated += 1;
    console.log(`Updated tour ${tour.slug}`);
  }

  console.log(`Done. Updated ${updated} tours.`);
}

async function main() {
  await fixBlogImages();
  await fixTourImages();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
