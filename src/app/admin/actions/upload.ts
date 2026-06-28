"use server";

import { createClient } from "@/lib/supabase/server";
import { compressImage } from "@/lib/image-compress";
import { requireStaff } from "@/lib/supabase/auth";

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
  const { buffer, contentType, ext } = await compressImage(raw);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage.from("media").upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("media").getPublicUrl(path);

  return { success: true, url: publicUrl };
}

export async function uploadMediaAction(formData: FormData): Promise<UploadResult> {
  await requireStaff();

  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "uploads").trim() || "uploads";

  if (!(file instanceof File)) {
    return { success: false, error: "No file selected." };
  }

  return uploadOne(file, folder);
}

export async function uploadMediaBatchAction(formData: FormData) {
  await requireStaff();

  const folder = String(formData.get("folder") ?? "uploads").trim() || "uploads";
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
