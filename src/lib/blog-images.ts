const BROKEN_UNSPLASH_IDS: Record<string, string> = {
  "photo-1523800503107-5bc3ce2a3a7d": "photo-1542744173-8e7e53415bb0",
};

const DEFAULT_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80";

function replaceBrokenUnsplashUrls(image: string) {
  let resolved = image;
  for (const [broken, fixed] of Object.entries(BROKEN_UNSPLASH_IDS)) {
    if (resolved.includes(broken)) {
      resolved = resolved.replace(broken, fixed);
    }
  }
  return resolved;
}

function supabaseBlogPublicUrl(filename: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/media/blog/${filename}`;
}

/** Resolve blog image paths to working public URLs at read time. */
export function normalizeBlogImageUrl(image: string | null | undefined) {
  if (!image?.trim()) return DEFAULT_BLOG_IMAGE;

  const resolved = replaceBrokenUnsplashUrls(image.trim());

  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved;
  }

  if (resolved.startsWith("/images/blog/")) {
    const filename = resolved.split("/").pop();
    if (filename) {
      const supabaseUrl = supabaseBlogPublicUrl(filename);
      if (supabaseUrl) return supabaseUrl;
    }
  }

  return resolved || DEFAULT_BLOG_IMAGE;
}
