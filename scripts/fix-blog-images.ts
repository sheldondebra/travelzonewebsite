import { normalizeBlogImageUrl } from "@/lib/blog-images";
import { createAdminClient } from "@/lib/supabase/admin";
import { staticBlogPosts } from "@/lib/seed-data";
import { loadLocalEnv } from "./load-env";
import { resolveBlogImageUrl } from "./upload-blog-images";

loadLocalEnv();

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80";

async function urlIsReachable(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function fixBlogImages() {
  const admin = createAdminClient();
  const seedBySlug = new Map(staticBlogPosts.map((post) => [post.slug, post]));
  const { data: posts, error } = await admin
    .from("blog_posts")
    .select("id, slug, image");

  if (error) throw new Error(error.message);

  let updated = 0;

  for (const post of posts ?? []) {
    const seed = seedBySlug.get(post.slug);
    let nextUrl = normalizeBlogImageUrl(post.image);

    if (!nextUrl || !(await urlIsReachable(nextUrl))) {
      const seedImage = seed ? await resolveBlogImageUrl(seed.image) : null;
      nextUrl = normalizeBlogImageUrl(seedImage ?? DEFAULT_FALLBACK);
    }

    if (post.image === nextUrl) continue;

    const { error: updateError } = await admin
      .from("blog_posts")
      .update({ image: nextUrl })
      .eq("id", post.id);

    if (updateError) throw new Error(`${post.slug}: ${updateError.message}`);

    updated += 1;
    console.log(`Updated ${post.slug}`);
  }

  console.log(`Done. Updated ${updated} blog post images.`);
}

fixBlogImages().catch((error) => {
  console.error(error);
  process.exit(1);
});
