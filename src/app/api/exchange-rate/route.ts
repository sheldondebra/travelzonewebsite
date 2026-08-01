import { getUsdToGhsRateAsync } from "@/lib/currency-server";

export async function GET() {
  const info = await getUsdToGhsRateAsync();

  return Response.json(info, {
    headers: {
      // Manual admin rates should apply quickly after save; live rates can stay longer.
      "Cache-Control":
        info.source === "live"
          ? "public, s-maxage=3600, stale-while-revalidate=600"
          : "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
