import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { downloadViaFtp } from "@/lib/ftp-media";
import { getFtpSettingsForUpload } from "@/lib/site-settings";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const MEDIA_ROOT = path.join(PUBLIC_ROOT, "media");

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
};

export type LoadedMediaFile = {
  buffer: Buffer;
  contentType: string;
};

export function sanitizeMediaPath(parts: string[]) {
  const cleaned = parts
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..");

  if (cleaned.length === 0) return null;

  const joined = cleaned.join("/");
  if (!/^[a-z0-9][a-z0-9/_.,-]*$/i.test(joined)) return null;

  const ext = joined.split(".").pop()?.toLowerCase() ?? "";
  if (!IMAGE_CONTENT_TYPES[ext]) return null;

  return joined;
}

export function contentTypeForMediaPath(relativePath: string) {
  const ext = relativePath.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_CONTENT_TYPES[ext] ?? "image/webp";
}

async function readWithinRoot(root: string, relativePath: string): Promise<Buffer | null> {
  const target = path.join(root, relativePath);
  if (!target.startsWith(root)) return null;

  try {
    return await readFile(target);
  } catch {
    return null;
  }
}

/** Read a file committed under `public/` (e.g. `images/hero/office-main.jpg`). */
export async function loadPublicFile(relativePath: string): Promise<LoadedMediaFile | null> {
  const buffer = await readWithinRoot(PUBLIC_ROOT, relativePath);
  if (!buffer) return null;
  return { buffer, contentType: contentTypeForMediaPath(relativePath) };
}

/** Read an uploaded media file: local `public/media` first, then FTP storage. */
export async function loadMediaFile(relativePath: string): Promise<LoadedMediaFile | null> {
  const local = await readWithinRoot(MEDIA_ROOT, relativePath);
  if (local) {
    return { buffer: local, contentType: contentTypeForMediaPath(relativePath) };
  }

  const ftp = await getFtpSettingsForUpload();
  if (!ftp) return null;

  try {
    const { buffer, contentType } = await downloadViaFtp(ftp, relativePath);
    return { buffer, contentType };
  } catch {
    return null;
  }
}
