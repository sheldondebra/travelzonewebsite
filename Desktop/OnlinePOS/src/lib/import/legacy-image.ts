const PLACEHOLDER_IMAGES = new Set([
  "no-image.png",
  "no_avatar.png",
  "no-image.jpg",
  "default.png",
]);

/** Map legacy MySQL image filename to static path under /public/products (client-safe). */
export function resolveLegacyImportImage(image: unknown): string | null {
  if (image == null || image === "") return null;
  const raw = String(image).trim();
  if (!raw || PLACEHOLDER_IMAGES.has(raw.toLowerCase())) return null;

  const fileName = raw.replace(/^\/+/, "").split("/").pop()!;
  if (!fileName || PLACEHOLDER_IMAGES.has(fileName.toLowerCase())) return null;

  return `/products/${encodeImagePath(fileName)}`;
}

/** Encode filename segments so Next/static can serve files with spaces. */
export function encodeImagePath(fileName: string): string {
  return fileName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
