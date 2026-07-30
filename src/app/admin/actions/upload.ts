"use server";

import { compressImage } from "@/lib/image-compress";
import { requireStaff } from "@/lib/auth/staff";
import { saveMediaFile } from "@/lib/media-storage";

const ALLOWED_UPLOAD_ROOTS = new Set(["blog", "tours", "team", "hero", "uploads"]);

function sanitizeUploadFolder(folder: string): string {
  const normalized = folder
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..")
    .join("/")
    .slice(0, 120);

  const root = normalized.split("/")[0];
  if (!root || !ALLOWED_UPLOAD_ROOTS.has(root)) {
    return "uploads";
  }

  if (!/^[a-z0-9][a-z0-9/_-]*$/i.test(normalized)) {
    return "uploads";
  }

  return normalized;
}

export type UploadResult =
  | { success: true; url: string }
  | { success: false; error: string };

async function uploadOne(file: File, folder: string): Promise<UploadResult> {
  if (file.size === 0) {
    return { success: false, error: "Empty file." };
  }

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Only image files are allowed." };
  }

  const raw = Buffer.from(await file.arrayBuffer());
  const { buffer, ext, contentType } = await compressImage(raw);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const url = await saveMediaFile(folder, filename, buffer, contentType);
    return { success: true, url };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return { success: false, error: message };
  }
}

export async function uploadMediaAction(formData: FormData): Promise<UploadResult> {
  await requireStaff();

  const file = formData.get("file");
  const folder = sanitizeUploadFolder(String(formData.get("folder") ?? "uploads"));

  if (!(file instanceof File)) {
    return { success: false, error: "No file selected." };
  }

  return uploadOne(file, folder);
}

export async function uploadMediaBatchAction(formData: FormData) {
  await requireStaff();

  const folder = sanitizeUploadFolder(String(formData.get("folder") ?? "uploads"));
  const files = formData.getAll("files").filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return { success: false as const, error: "No files selected.", urls: [] as string[] };
  }

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = await uploadOne(file, folder);
    if (result.success) {
      urls.push(result.url);
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  }

  if (urls.length === 0) {
    return {
      success: false as const,
      error: errors.join(" "),
      urls: [] as string[],
    };
  }

  return {
    success: true as const,
    urls,
    error: errors.length ? errors.join(" ") : undefined,
  };
}
