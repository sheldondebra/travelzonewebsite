import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { basename, join } from "path";
import { getDatabaseUrl } from "./db-url";
import { loadLocalEnv } from "./load-env";
import { createPostgresClient } from "./postgres-client";

loadLocalEnv();

const BLOG_IMAGE_DIR = join(process.cwd(), "public/images/blog");
const MEDIA_BLOG_DIR = join(process.cwd(), "public/media/blog");

export async function uploadBlogImageFile(filename: string) {
  const filePath = join(BLOG_IMAGE_DIR, filename);
  if (!existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  mkdirSync(MEDIA_BLOG_DIR, { recursive: true });
  const destination = join(MEDIA_BLOG_DIR, filename);
  copyFileSync(filePath, destination);

  return `/media/blog/${filename}`;
}

export async function resolveBlogImageUrl(image: string) {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (!image.startsWith("/images/blog/")) {
    return image;
  }

  const filename = basename(image);
  return uploadBlogImageFile(filename);
}

async function syncBlogImages() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required in .env.local");
  }

  const sql = createPostgresClient(databaseUrl);
  const files = readdirSync(BLOG_IMAGE_DIR).filter((name) =>
    /\.(jpe?g|png|webp)$/i.test(name),
  );

  const urlByLocalPath = new Map<string, string>();

  for (const filename of files) {
    const localPath = `/images/blog/${filename}`;
    const publicUrl = await uploadBlogImageFile(filename);
    urlByLocalPath.set(localPath, publicUrl);
    console.log(`Copied ${filename} to /media/blog/`);
  }

  try {
    const posts = await sql<{ slug: string; image: string }[]>`
      select slug, image from public.blog_posts
    `;

    let updated = 0;
    for (const post of posts) {
      const nextUrl = urlByLocalPath.get(post.image);
      if (!nextUrl || post.image === nextUrl) continue;

      await sql`
        update public.blog_posts
        set image = ${nextUrl}, updated_at = now()
        where slug = ${post.slug}
      `;
      updated += 1;
      console.log(`Updated ${post.slug}`);
    }

    console.log(`Done. Copied ${files.length} files, updated ${updated} blog posts.`);
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.includes("upload-blog-images")) {
  syncBlogImages().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
