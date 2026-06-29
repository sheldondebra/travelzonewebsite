const BROKEN_UNSPLASH_IDS: Record<string, string> = {
  "photo-1523800503107-5bc3ce2a3a7d": "photo-1542744173-8e7e53415bb0",
};

export const DEFAULT_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80";

function getSupabaseBaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "") ?? null;
}

function replaceBrokenUnsplashUrls(image: string) {
  let resolved = image;
  for (const [broken, fixed] of Object.entries(BROKEN_UNSPLASH_IDS)) {
    if (resolved.includes(broken)) {
      resolved = resolved.replace(broken, fixed);
    }
  }
  return resolved;
}

function extractMediaStoragePath(value: string): string | null {
  const patterns = [
    /\/storage\/v1\/object\/public\/media\/(.+)$/i,
    /^media\/(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return null;
}

function supabasePublicUrl(storagePath: string) {
  const baseUrl = getSupabaseBaseUrl();
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/media/${storagePath}`;
}

function rewriteKnownStorageUrl(url: string) {
  const storagePath = extractMediaStoragePath(url);
  if (!storagePath) return url;

  const rewritten = supabasePublicUrl(storagePath);
  return rewritten ?? url;
}

function normalizeAbsoluteUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === "localhost" || host === "127.0.0.1") {
      const storagePath = extractMediaStoragePath(parsed.pathname);
      if (storagePath) {
        return supabasePublicUrl(storagePath) ?? parsed.pathname;
      }

      if (parsed.pathname.startsWith("/images/")) {
        return parsed.pathname;
      }
    }

    if (host.endsWith(".supabase.co")) {
      return rewriteKnownStorageUrl(url);
    }

    return replaceBrokenUnsplashUrls(url);
  } catch {
    return url;
  }
}

/** Resolve image paths to working URLs on the current deployment. */
export function normalizeMediaUrl(image: string | null | undefined, fallback?: string) {
  const defaultFallback = fallback ?? DEFAULT_BLOG_IMAGE;
  if (!image?.trim()) return defaultFallback;

  let resolved = image.trim();

  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    resolved = normalizeAbsoluteUrl(resolved);
    return resolved || defaultFallback;
  }

  if (resolved.startsWith("//")) {
    return normalizeAbsoluteUrl(`https:${resolved}`);
  }

  resolved = replaceBrokenUnsplashUrls(resolved);

  if (resolved.startsWith("/images/")) {
    return resolved;
  }

  if (resolved.startsWith("/")) {
    return resolved;
  }

  const storagePath = extractMediaStoragePath(resolved);
  if (storagePath) {
    return supabasePublicUrl(storagePath) ?? defaultFallback;
  }

  return resolved || defaultFallback;
}

export function normalizeMediaUrls(urls: string[] | null | undefined) {
  if (!urls?.length) return [];
  return urls.map((url) => normalizeMediaUrl(url, url)).filter(Boolean);
}

export function normalizeHtmlImageUrls(html: string) {
  if (!html.trim()) return html;

  return html.replace(
    /(<img\b[^>]*\ssrc=)(["'])([^"']+)\2/gi,
    (_match, prefix, quote, src) => `${prefix}${quote}${normalizeMediaUrl(src, src)}${quote}`,
  );
}

/** @deprecated Use normalizeMediaUrl */
export function normalizeBlogImageUrl(image: string | null | undefined) {
  return normalizeMediaUrl(image);
}
