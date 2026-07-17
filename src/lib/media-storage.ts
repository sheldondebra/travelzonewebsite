import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MEDIA_ROOT = path.join(process.cwd(), "public", "media");

export function getPublicMediaUrl(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, "");
  return `/media/${normalized}`;
}

export async function saveMediaFile(
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
