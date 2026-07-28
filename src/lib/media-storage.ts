import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

const MEDIA_ROOT = path.join(process.cwd(), "public", "media");

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function isServerlessRuntime() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export function getPublicMediaUrl(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, "");
  return `/media/${normalized}`;
}

async function saveLocalMediaFile(
  folder: string,
  filename: string,
  buffer: Buffer,
) {
  const dir = path.join(MEDIA_ROOT, folder);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);
  return getPublicMediaUrl(`${folder}/${filename}`);
}

async function saveBlobMediaFile(
  folder: string,
  filename: string,
  buffer: Buffer,
  contentType = "image/webp",
) {
  const pathname = `media/${folder}/${filename}`.replace(/\/+/g, "/");
  const blob = await put(pathname, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return blob.url;
}

/**
 * Persist an uploaded image.
 * - Local/dev: write under public/media (gitignored uploads)
 * - Production (Vercel): require Vercel Blob — the serverless filesystem is read-only
 */
export async function saveMediaFile(
  folder: string,
  filename: string,
  buffer: Buffer,
  contentType = "image/webp",
) {
  if (hasBlobToken()) {
    return saveBlobMediaFile(folder, filename, buffer, contentType);
  }

  if (isServerlessRuntime()) {
    throw new Error(
      "Image uploads need BLOB_READ_WRITE_TOKEN on Vercel. Add a Blob store in the Vercel project and set that env var.",
    );
  }

  try {
    return await saveLocalMediaFile(folder, filename, buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT") || message.includes("EROFS") || message.includes("read-only")) {
      throw new Error(
        "Cannot write uploaded images on this host. Configure BLOB_READ_WRITE_TOKEN (Vercel Blob).",
      );
    }
    throw error;
  }
}
