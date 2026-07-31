import "server-only";

import { loadMediaFile, loadPublicFile, sanitizeMediaPath } from "@/lib/media-file";
import { canProxyShareImage } from "@/lib/og-image";

const REMOTE_TIMEOUT_MS = 8000;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

function toRelativePath(image: string): string | null {
  if (image.startsWith("/")) return image;

  try {
    const parsed = new URL(image);
    if (
      parsed.hostname === "travelzonegh.org" ||
      parsed.hostname === "www.travelzonegh.org"
    ) {
      return parsed.pathname;
    }
  } catch {
    return null;
  }

  return null;
}

async function loadLocal(relativePath: string): Promise<Buffer | null> {
  const segments = relativePath.split("/").filter(Boolean);
  const [root, ...rest] = segments;
  const safePath = sanitizeMediaPath(rest);
  if (!safePath) return null;

  if (root === "media") {
    const file = await loadMediaFile(safePath);
    return file?.buffer ?? null;
  }

  if (root === "images") {
    const file = await loadPublicFile(`images/${safePath}`);
    return file?.buffer ?? null;
  }

  return null;
}

async function loadRemote(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    if (!response.headers.get("content-type")?.startsWith("image/")) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SOURCE_BYTES) return null;
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/** Load the original bytes behind a share image, or null when unavailable. */
export async function loadShareImageSource(image: string): Promise<Buffer | null> {
  const trimmed = image.trim();
  if (!trimmed || !canProxyShareImage(trimmed)) return null;

  const relativePath = toRelativePath(trimmed);
  if (relativePath) return loadLocal(relativePath);

  return loadRemote(trimmed);
}
