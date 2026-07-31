import { loadMediaFile, sanitizeMediaPath } from "@/lib/media-file";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { path: pathParts } = await context.params;
  const relativePath = sanitizeMediaPath(pathParts ?? []);
  if (!relativePath) {
    return new Response("Not found", { status: 404 });
  }

  const file = await loadMediaFile(relativePath);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
