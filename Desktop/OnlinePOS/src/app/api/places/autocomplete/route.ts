import { autocompletePlaces } from "@/server/services/places/geocode";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async () => {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("input") ?? "";
    const result = await autocompletePlaces(input);
    return apiSuccess(result);
  });
}
