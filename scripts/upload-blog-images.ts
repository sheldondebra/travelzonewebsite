import { readFileSync, readdirSync, existsSync } from "fs";
import { basename, join } from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

const BLOG_IMAGE_DIR = join(process.cwd(), "public/images/blog");

function contentTypeFor(filename: string) {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function uploadBlogImageFile(filename: string) {
  const filePath = join(BLOG_IMAGE_DIR, filename);
  if (!existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  const admin = createAdminClient();
  const storagePath = `blog/${filename}`;
  const buffer = readFileSync(filePath);

  const { error } = await admin.storage.from("media").upload(storagePath, buffer, {
    contentType: contentTypeFor(filename),
    upsert: true,
  });

  if (error) throw new Error(`${filename}: ${error.message}`);

  const {
    data: { publicUrl },
  } = admin.storage.from("media").getPublicUrl(storagePath);

  return publicUrl;
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
  const admin = createAdminClient();
  const files = readdirSync(BLOG_IMAGE_DIR).filter((name) =>
    /\.(jpe?g|png|webp)$/i.test(name),
  );

  const urlByLocalPath = new Map<string, string>();

  for (const filename of files) {
    const localPath = `/images/blog/${filename}`;
    const publicUrl = await uploadBlogImageFile(filename);
    urlByLocalPath.set(localPath, publicUrl);
    console.log(`Uploaded ${filename}`);
  }

  const { data: posts, error } = await admin.from("blog_posts").select("slug, image");
  if (error) throw new Error(error.message);

  let updated = 0;
  for (const post of posts ?? []) {
    const nextUrl = urlByLocalPath.get(post.image);
    if (!nextUrl || post.image === nextUrl) continue;

    const { error: updateError } = await admin
      .from("blog_posts")
      .update({ image: nextUrl })
      .eq("slug", post.slug);

    if (updateError) throw new Error(`${post.slug}: ${updateError.message}`);
    updated += 1;
    console.log(`Updated ${post.slug}`);
  }

  console.log(`Done. Uploaded ${files.length} files, updated ${updated} blog posts.`);
}

if (process.argv[1]?.includes("upload-blog-images")) {
  syncBlogImages().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
