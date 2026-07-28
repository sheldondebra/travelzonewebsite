import { readFile } from "fs/promises";
import path from "path";
import { downloadViaFtp } from "@/lib/ftp-media";
import { getFtpSettingsForUpload } from "@/lib/site-settings";

export const runtime = "nodejs";

const MEDIA_ROOT = path.join(process.cwd(), "public", "media");

const ALLOWED_EXT = new Set([
  "webp",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "avif",
  "svg",
]);

function sanitizeMediaPath(parts: string[]) {
  const cleaned = parts
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..");

  if (cleaned.length === 0) return null;

  const joined = cleaned.join("/");
  if (!/^[a-z0-9][a-z0-9/_.,-]*$/i.test(joined)) return null;

  const ext = joined.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.has(ext)) return null;

  return joined;
}

function cacheHeaders(contentType: string) {
  return {
    "Content-Type": contentType,
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
  };
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { path: pathParts } = await context.params;
  const relativePath = sanitizeMediaPath(pathParts ?? []);
  if (!relativePath) {
    return new Response("Not found", { status: 404 });
  }

  // Local files (dev / committed assets) take priority.
  try {
    const localPath = path.join(MEDIA_ROOT, relativePath);
    if (localPath.startsWith(MEDIA_ROOT)) {
      const buffer = await readFile(localPath);
      const ext = relativePath.split(".").pop()?.toLowerCase() ?? "webp";
      const type =
        ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "png"
            ? "image/png"
            : ext === "gif"
              ? "image/gif"
              : ext === "svg"
                ? "image/svg+xml"
                : ext === "avif"
                  ? "image/avif"
                  : "image/webp";
      return new Response(buffer, { headers: cacheHeaders(type) });
    }
  } catch {
    // Fall through to FTP.
  }

  const ftp = await getFtpSettingsForUpload();
  if (!ftp) {
    return new Response("Media storage not configured", { status: 404 });
  }

  try {
    const { buffer, contentType } = await downloadViaFtp(ftp, relativePath);
    return new Response(new Uint8Array(buffer), {
      headers: cacheHeaders(contentType),
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
