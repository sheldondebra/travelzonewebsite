import { getPlaceDetails } from "@/server/services/places/geocode";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const placeId = searchParams.get("placeId");
      const provider = searchParams.get("provider") as
        | "google"
        | "nominatim"
        | null;
      const lat = searchParams.get("lat");
      const lon = searchParams.get("lon");
      const coords =
        lat && lon
          ? { lat: parseFloat(lat), lon: parseFloat(lon) }
          : undefined;

      if (!placeId && !coords) {
        return handleApiError(new Error("placeId or lat/lon is required"));
      }

      const details = await getPlaceDetails(
        placeId ?? "0",
        provider ?? undefined,
        coords,
      );
      return apiSuccess(details);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
