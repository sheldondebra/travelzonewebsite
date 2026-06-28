import { getUsdToGhsRateAsync } from "@/lib/currency";

export async function GET() {
  const info = await getUsdToGhsRateAsync();

  return Response.json(info, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
