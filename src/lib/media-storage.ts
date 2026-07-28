import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { isFtpUploadReady, uploadViaFtp } from "@/lib/ftp-media";
import { getFtpSettingsForUpload } from "@/lib/site-settings";

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
 * Priority: connected FTP → Vercel Blob → local public/media (dev).
 */
export async function saveMediaFile(
  folder: string,
  filename: string,
  buffer: Buffer,
  contentType = "image/webp",
) {
  const ftp = await getFtpSettingsForUpload();
  if (ftp && isFtpUploadReady(ftp)) {
    return uploadViaFtp(ftp, folder, filename, buffer);
  }

  if (hasBlobToken()) {
    return saveBlobMediaFile(folder, filename, buffer, contentType);
  }

  if (isServerlessRuntime()) {
    throw new Error(
      "Image uploads need FTP (Settings → Media) or BLOB_READ_WRITE_TOKEN on Vercel.",
    );
  }

  try {
    return await saveLocalMediaFile(folder, filename, buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT") || message.includes("EROFS") || message.includes("read-only")) {
      throw new Error(
        "Cannot write uploaded images on this host. Connect FTP in Settings → Media, or set BLOB_READ_WRITE_TOKEN.",
      );
    }
    throw error;
  }
}
