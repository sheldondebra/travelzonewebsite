export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
  latitude?: number;
  longitude?: number;
  provider: "google" | "nominatim";
};

export type PlaceDetails = {
  placeId: string;
  formattedAddress: string;
  address: string;
  city?: string;
  region?: string;
  latitude: number;
  longitude: number;
};

function googleKey() {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || "";
}

export async function autocompletePlaces(
  input: string,
): Promise<{ suggestions: PlaceSuggestion[]; provider: "google" | "nominatim" }> {
  const q = input.trim();
  if (q.length < 3) return { suggestions: [], provider: "google" };

  const key = googleKey();
  if (key) {
    const params = new URLSearchParams({
      input: q,
      key,
      components: "country:gh",
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
    );
    const data = (await res.json()) as {
      status: string;
      predictions?: {
        place_id: string;
        description: string;
        structured_formatting?: { main_text: string; secondary_text?: string };
      }[];
    };

    if (data.status === "OK" && data.predictions) {
      return {
        provider: "google",
        suggestions: data.predictions.map((p) => ({
          placeId: p.place_id,
          description: p.description,
          mainText: p.structured_formatting?.main_text ?? p.description,
          secondaryText: p.structured_formatting?.secondary_text,
          provider: "google" as const,
        })),
      };
    }
  }

  const nominatim = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        q: `${q}, Ghana`,
        format: "json",
        addressdetails: "1",
        limit: "6",
      }),
    {
      headers: {
        "User-Agent": "OnlinePOS/1.0 (delivery-autocomplete)",
      },
    },
  );
  const rows = (await nominatim.json()) as {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
      road?: string;
      suburb?: string;
      city?: string;
      town?: string;
      state?: string;
    };
  }[];

  return {
    provider: "nominatim",
    suggestions: rows.map((r) => ({
      placeId: String(r.place_id),
      description: r.display_name,
      mainText: r.address?.road ?? r.display_name.split(",")[0] ?? r.display_name,
      secondaryText: r.display_name,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      provider: "nominatim" as const,
    })),
  };
}

function parseGoogleComponents(
  components: { long_name: string; short_name: string; types: string[] }[],
) {
  let city: string | undefined;
  let region: string | undefined;
  for (const c of components) {
    if (
      c.types.includes("locality") ||
      c.types.includes("administrative_area_level_2")
    ) {
      city = city ?? c.long_name;
    }
    if (c.types.includes("administrative_area_level_1")) {
      region = c.long_name;
    }
  }
  return { city, region };
}

export async function getPlaceDetailsFromCoords(
  lat: number,
  lon: number,
): Promise<PlaceDetails> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?` +
      new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: "json",
        addressdetails: "1",
      }),
    { headers: { "User-Agent": "OnlinePOS/1.0 (delivery-reverse)" } },
  );
  const row = (await res.json()) as {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
      road?: string;
      house_number?: string;
      suburb?: string;
      city?: string;
      town?: string;
      state?: string;
    };
  };

  const street = [row.address?.house_number, row.address?.road]
    .filter(Boolean)
    .join(" ");

  return {
    placeId: String(row.place_id),
    formattedAddress: row.display_name,
    address: street || row.display_name.split(",")[0] || row.display_name,
    city: row.address?.city ?? row.address?.town ?? row.address?.suburb,
    region: row.address?.state,
    latitude: parseFloat(row.lat),
    longitude: parseFloat(row.lon),
  };
}

export async function getPlaceDetails(
  placeId: string,
  providerHint?: "google" | "nominatim",
  coords?: { lat: number; lon: number },
): Promise<PlaceDetails> {
  if (coords) {
    return getPlaceDetailsFromCoords(coords.lat, coords.lon);
  }
  const key = googleKey();
  if (key && providerHint !== "nominatim") {
    const params = new URLSearchParams({
      place_id: placeId,
      key,
      fields: "formatted_address,geometry,address_components,name",
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
    );
    const data = (await res.json()) as {
      status: string;
      result?: {
        formatted_address: string;
        name?: string;
        geometry: { location: { lat: number; lng: number } };
        address_components: {
          long_name: string;
          short_name: string;
          types: string[];
        }[];
      };
    };

    if (data.status === "OK" && data.result) {
      const { city, region } = parseGoogleComponents(data.result.address_components);
      return {
        placeId,
        formattedAddress: data.result.formatted_address,
        address: data.result.name ?? data.result.formatted_address,
        city,
        region,
        latitude: data.result.geometry.location.lat,
        longitude: data.result.geometry.location.lng,
      };
    }
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/lookup?` +
      new URLSearchParams({
        osm_ids: `N${placeId}`,
        format: "json",
        addressdetails: "1",
      }),
    {
      headers: { "User-Agent": "OnlinePOS/1.0 (delivery-details)" },
    },
  );
  const rows = (await res.json()) as {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
      road?: string;
      house_number?: string;
      suburb?: string;
      city?: string;
      town?: string;
      state?: string;
    };
  }[];

  const row = rows[0];
  if (!row) throw new Error("Place not found");

  const street = [row.address?.house_number, row.address?.road]
    .filter(Boolean)
    .join(" ");
  return {
    placeId,
    formattedAddress: row.display_name,
    address: street || row.display_name.split(",")[0] || row.display_name,
    city: row.address?.city ?? row.address?.town ?? row.address?.suburb,
    region: row.address?.state,
    latitude: parseFloat(row.lat),
    longitude: parseFloat(row.lon),
  };
}
