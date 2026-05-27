import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { encodeImagePath } from "@/lib/import/legacy-image";

const PLACEHOLDER_IMAGES = new Set([
  "no-image.png",
  "no_avatar.png",
  "no-image.jpg",
  "default.png",
]);

let fileIndex: Set<string> | null = null;

function getProductsDir(): string {
  const cwd = process.cwd();
  const candidates = [
    join(cwd, "public", "products"),
    join(cwd, "products"),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return join(cwd, "public", "products");
}

function loadFileIndex(): Set<string> {
  if (fileIndex) return fileIndex;
  const dir = getProductsDir();
  if (!existsSync(dir)) {
    fileIndex = new Set();
    return fileIndex;
  }
  fileIndex = new Set(readdirSync(dir));
  return fileIndex;
}

/** Clear cache after bulk import (tests / scripts). */
export function resetProductImageFileIndex() {
  fileIndex = null;
}

/**
 * Map legacy `image` column to a URL under /products that exists on disk.
 * Matches exact filename, or `{id}_suffix` files when only suffix overlaps.
 */
export function resolveProductImageOnDisk(image: unknown): string | null {
  if (image == null || image === "") return null;
  const raw = String(image).trim();
  if (!raw || PLACEHOLDER_IMAGES.has(raw.toLowerCase())) return null;

  const fileName = raw.replace(/^\/+/, "").split("/").pop()!;
  if (!fileName || PLACEHOLDER_IMAGES.has(fileName.toLowerCase())) return null;

  const index = loadFileIndex();
  if (index.has(fileName)) {
    return `/products/${encodeImagePath(fileName)}`;
  }

  const underscore = fileName.indexOf("_");
  if (underscore > 0) {
    const suffix = fileName.slice(underscore + 1);
    for (const f of index) {
      if (f === fileName) continue;
      if (f.endsWith(`_${suffix}`) || f.endsWith(suffix)) {
        return `/products/${encodeImagePath(f)}`;
      }
    }
  }

  for (const f of index) {
    if (f.includes(fileName)) {
      return `/products/${encodeImagePath(f)}`;
    }
  }

  return null;
}
