const BROKEN_UNSPLASH_IDS: Record<string, string> = {
  "photo-1523800503107-5bc3ce2a3a7d": "photo-1542744173-8e7e53415bb0",
  // Removed from Unsplash — Dubai gallery photo 2
  "photo-1582672060016-769a9fb3a48b": "photo-1489515217757-5fd1be406fef",
};

export const DEFAULT_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80";

const NEXT_IMAGE_HOSTS = new Set(["images.unsplash.com"]);

function isVercelBlobHost(hostname: string) {
  return (
    hostname === "blob.vercel-storage.com" ||
    hostname.endsWith(".blob.vercel-storage.com") ||
    hostname.endsWith(".public.blob.vercel-storage.com")
  );
}

function isAllowedRemoteImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return NEXT_IMAGE_HOSTS.has(parsed.hostname) || isVercelBlobHost(parsed.hostname);
  } catch {
    return false;
  }
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

function extractLegacyStoragePath(value: string): string | null {
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

function normalizeAbsoluteUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === "localhost" || host === "127.0.0.1") {
      const storagePath = extractLegacyStoragePath(parsed.pathname);
      if (storagePath) {
        return `/media/${storagePath}`;
      }

      if (parsed.pathname.startsWith("/images/") || parsed.pathname.startsWith("/media/")) {
        return parsed.pathname;
      }
    }

    if (host.endsWith(".supabase.co")) {
      const storagePath = extractLegacyStoragePath(url);
      if (storagePath) return `/media/${storagePath}`;
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
    if (!resolved || !isAllowedRemoteImageUrl(resolved)) {
      if (resolved.startsWith("/")) return resolved;
      return defaultFallback;
    }
    return resolved;
  }

  if (resolved.startsWith("//")) {
    const absolute = normalizeAbsoluteUrl(`https:${resolved}`);
    if (!absolute || !isAllowedRemoteImageUrl(absolute)) {
      if (absolute.startsWith("/")) return absolute;
      return defaultFallback;
    }
    return absolute;
  }

  resolved = replaceBrokenUnsplashUrls(resolved);

  if (resolved.startsWith("/")) {
    return resolved;
  }

  if (resolved.startsWith("images/")) {
    return `/${resolved}`;
  }

  const storagePath = extractLegacyStoragePath(resolved);
  if (storagePath) {
    return `/media/${storagePath}`;
  }

  return resolved || defaultFallback;
}

/** Image src safe for next/image — always local or an allowed remote host. */
export function getNextImageSrc(image: string | null | undefined, fallback?: string) {
  return normalizeMediaUrl(image, fallback);
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
