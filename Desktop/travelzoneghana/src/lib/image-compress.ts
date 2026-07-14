import sharp from "sharp";

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 82;

export async function compressImage(buffer: Buffer) {
  const compressed = await sharp(buffer)
    .rotate()
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return {
    buffer: compressed,
    contentType: "image/webp",
    ext: "webp",
  };
}
