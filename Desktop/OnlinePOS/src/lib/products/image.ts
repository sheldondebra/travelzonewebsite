import { resolveLegacyImportImage } from "@/lib/import/legacy-image";

const PLACEHOLDER = "/placeholder-product.svg";

export function getProductImageUrl(imageUrl?: string | null): string {
  if (!imageUrl?.trim()) return PLACEHOLDER;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/products/")) return imageUrl;

  const legacy = resolveLegacyImportImage(imageUrl);
  if (legacy) return legacy;

  const base = process.env.NEXT_PUBLIC_OLD_IMAGE_BASE_URL?.replace(/\/$/, "");
  if (base) {
    const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${base}${path}`;
  }
  if (imageUrl.startsWith("/")) return imageUrl;
  return imageUrl;
}
