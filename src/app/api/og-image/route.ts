import sharp from "sharp";
import {
  OG_IMAGE_BACKGROUND,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from "@/lib/og-image";
import { siteConfig } from "@/lib/seo";
import { loadShareImageSource } from "@/lib/share-image-source";

export const runtime = "nodejs";

const JPEG_QUALITY = 82;

async function toShareJpeg(source: Buffer) {
  return sharp(source, { failOn: "none" })
    .rotate()
    // Portrait tour posters are letterboxed rather than cropped so the whole
    // artwork stays readable in the preview card.
    .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
      fit: "contain",
      background: OG_IMAGE_BACKGROUND,
    })
    .flatten({ background: OG_IMAGE_BACKGROUND })
    .jpeg({ quality: JPEG_QUALITY, progressive: true })
    .toBuffer();
}

export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src") ?? "";

  const source =
    (await loadShareImageSource(src)) ??
    (await loadShareImageSource(siteConfig.defaultOgImage));

  if (!source) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const jpeg = await toShareJpeg(source);
    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpeg.byteLength),
        "Cache-Control": "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
