/** Ghana regions and major cities/towns for delivery dropdowns */
export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Western North",
  "Central",
  "Eastern",
  "Volta",
  "Oti",
  "Northern",
  "Savannah",
  "North East",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
] as const;

export type GhanaRegion = (typeof GHANA_REGIONS)[number];

export const GHANA_CITIES_BY_REGION: Record<GhanaRegion, string[]> = {
  "Greater Accra": [
    "Accra",
    "Tema",
    "Madina",
    "Adenta",
    "Ashaiman",
    "Kasoa",
    "Teshie",
    "Nungua",
    "Dansoman",
    "East Legon",
    "Osu",
    "Spintex",
    "Achimota",
    "Dome",
    "Haatso",
    "Labadi",
  ],
  Ashanti: [
    "Kumasi",
    "Obuasi",
    "Ejisu",
    "Konongo",
    "Mampong",
    "Bekwai",
    "Offinso",
  ],
  Western: ["Takoradi", "Sekondi", "Tarkwa", "Axim", "Prestea"],
  "Western North": ["Sefwi Wiawso", "Bibiani", "Enchi"],
  Central: ["Cape Coast", "Winneba", "Kasoa", "Swedru", "Elmina", "Agona Swedru"],
  Eastern: ["Koforidua", "Nkawkaw", "Akosombo", "Nsawam", "Suhum", "Aburi"],
  Volta: ["Ho", "Hohoe", "Keta", "Aflao", "Kpando"],
  Oti: ["Dambai", "Jasikan", "Kadjebi"],
  Northern: ["Tamale", "Yendi", "Savelugu", "Bimbilla"],
  Savannah: ["Damongo", "Salaga", "Bole"],
  "North East": ["Nalerigu", "Walewale", "Gambaga"],
  "Upper East": ["Bolgatanga", "Bawku", "Navrongo"],
  "Upper West": ["Wa", "Tumu", "Lawra"],
  Bono: ["Sunyani", "Berekum", "Dormaa Ahenkro"],
  "Bono East": ["Techiman", "Kintampo", "Atebubu"],
  Ahafo: ["Goaso", "Bechem", "Hwidiem"],
};

export function getCitiesForRegion(region: string): string[] {
  const key = GHANA_REGIONS.find(
    (r) => r.toLowerCase() === region.trim().toLowerCase(),
  ) as GhanaRegion | undefined;
  return key ? GHANA_CITIES_BY_REGION[key] : [];
}

export function searchRegions(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...GHANA_REGIONS];
  return GHANA_REGIONS.filter((r) => r.toLowerCase().includes(q));
}

export function searchCities(region: string, query: string): string[] {
  const cities = getCitiesForRegion(region);
  const q = query.trim().toLowerCase();
  if (!q) return cities;
  return cities.filter((c) => c.toLowerCase().includes(q));
}

/** All cities flattened — used when no region selected yet */
export function searchAllCities(query: string): string[] {
  const q = query.trim().toLowerCase();
  const all = [...new Set(Object.values(GHANA_CITIES_BY_REGION).flat())].sort();
  if (!q) return all;
  return all.filter((c) => c.toLowerCase().includes(q));
}

/** Map geocoder region names to our Ghana region list */
export function normalizeGhanaRegion(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const lower = raw.toLowerCase();
  const exact = GHANA_REGIONS.find((r) => r.toLowerCase() === lower);
  if (exact) return exact;
  const partial = GHANA_REGIONS.find(
    (r) => lower.includes(r.toLowerCase()) || r.toLowerCase().includes(lower),
  );
  return partial ?? raw;
}

export function normalizeGhanaCity(raw?: string, region?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const cities = region ? getCitiesForRegion(region) : searchAllCities("");
  const lower = raw.toLowerCase();
  const match = cities.find((c) => c.toLowerCase() === lower);
  if (match) return match;
  const partial = cities.find(
    (c) => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower),
  );
  return partial ?? raw;
}
