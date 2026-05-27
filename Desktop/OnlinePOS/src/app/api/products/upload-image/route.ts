import { readdir, writeFile, mkdir } from "fs/promises";
import path from "path";
import { apiSuccess } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { withBusinessAuth } from "@/server/utils/with-auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "products");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function isImageFilename(name: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(name);
}

function sanitizeFilename(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export async function GET(request: Request) {
  return withBusinessAuth(request, async () => {
    await ensureUploadDir();
    let files: string[] = [];
    try {
      const entries = await readdir(UPLOAD_DIR);
      files = entries
        .filter(isImageFilename)
        .sort((a, b) => b.localeCompare(a))
        .slice(0, 48);
    } catch {
      files = [];
    }

    return apiSuccess(
      files.map((file) => ({
        url: `/products/${file}`,
        name: file,
      })),
      "Product images fetched",
    );
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async () => {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new AppError("Please choose an image to upload", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      throw new AppError("Use JPG, PNG, WebP, or GIF images only", 400);
    }

    if (file.size > MAX_BYTES) {
      throw new AppError("Image must be 5 MB or smaller", 400);
    }

    await ensureUploadDir();

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";

    const base = sanitizeFilename(file.name.replace(/\.[^.]+$/, "")) || "product";
    const filename = `${base}-${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filepath, buffer);

    return apiSuccess(
      { url: `/products/${filename}` },
      "Image uploaded successfully",
      201,
    );
  });
}
