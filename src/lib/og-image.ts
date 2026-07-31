/**
 * WhatsApp and other link-preview crawlers only render JPEG/PNG thumbnails, so
 * featured images (uploaded as WebP, often portrait) are served through
 * `/api/og-image` as a fixed-size JPEG instead of being linked directly.
 */
export const OG_IMAGE_ROUTE = "/api/og-image";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_TYPE = "image/jpeg";
export const OG_IMAGE_BACKGROUND = "#0c1a2e";

const PROXYABLE_REMOTE_HOSTS = new Set([
  "images.unsplash.com",
  "travelzonegh.org",
  "www.travelzonegh.org",
]);

function isVercelBlobHost(hostname: string) {
  return (
    hostname === "blob.vercel-storage.com" ||
    hostname.endsWith(".blob.vercel-storage.com") ||
    hostname.endsWith(".public.blob.vercel-storage.com")
  );
}

/** Only same-site media and known image hosts may be re-encoded (avoids SSRF). */
export function canProxyShareImage(image: string) {
  const trimmed = image.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("/")) {
    return trimmed.startsWith("/media/") || trimmed.startsWith("/images/");
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return PROXYABLE_REMOTE_HOSTS.has(parsed.hostname) || isVercelBlobHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function ogImagePath(image: string) {
  return `${OG_IMAGE_ROUTE}?src=${encodeURIComponent(image.trim())}`;
}
