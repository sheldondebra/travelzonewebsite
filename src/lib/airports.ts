export type AirportCategory = "domestic" | "regional" | "international";

export type Airport = {
  city: string;
  country: string;
  iata: string;
  category: AirportCategory;
};

export type AirportGroup = {
  category: AirportCategory;
  label: string;
  airports: Airport[];
};

export const AIRPORT_CATEGORY_LABELS: Record<AirportCategory, string> = {
  domestic: "Ghana domestic",
  regional: "Regional & West Africa",
  international: "International",
};

export function formatAirport(airport: Airport) {
  return `${airport.city} (${airport.iata})`;
}

function getDefaultAirportSuggestions(limit = 12): Airport[] {
  const perCategory = Math.max(2, Math.ceil(limit / 3));
  const domestic = AIRPORTS.filter((airport) => airport.category === "domestic").slice(0, perCategory);
  const regional = AIRPORTS.filter((airport) => airport.category === "regional").slice(0, perCategory);
  const international = AIRPORTS.filter((airport) => airport.category === "international").slice(
    0,
    perCategory,
  );
  return [...domestic, ...regional, ...international].slice(0, limit);
}

function groupAirportsByCategory(airports: Airport[]): AirportGroup[] {
  const categories: AirportCategory[] = ["domestic", "regional", "international"];

  return categories
    .map((category) => ({
      category,
      label: AIRPORT_CATEGORY_LABELS[category],
      airports: airports.filter((airport) => airport.category === category),
    }))
    .filter((group) => group.airports.length > 0);
}

export function searchAirports(query: string, limit = 12): Airport[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return getDefaultAirportSuggestions(limit);
  }

  const scored = AIRPORTS.map((airport) => {
    const city = airport.city.toLowerCase();
    const country = airport.country.toLowerCase();
    const iata = airport.iata.toLowerCase();
    const label = formatAirport(airport).toLowerCase();

    let score = 0;
    if (iata === normalized) score += 100;
    else if (iata.startsWith(normalized)) score += 80;
    else if (city.startsWith(normalized)) score += 70;
    else if (city.includes(normalized)) score += 50;
    else if (country.startsWith(normalized)) score += 40;
    else if (label.includes(normalized)) score += 30;
    else return null;

    return { airport, score };
  }).filter((item): item is { airport: Airport; score: number } => item !== null);

  return scored
    .sort((a, b) => b.score - a.score || a.airport.city.localeCompare(b.airport.city))
    .slice(0, limit)
    .map((item) => item.airport);
}

export function searchAirportGroups(query: string, limit = 12): AirportGroup[] {
  return groupAirportsByCategory(searchAirports(query, limit));
}

export function findAirportByLabel(label: string): Airport | undefined {
  const normalized = label.trim().toLowerCase();
  return AIRPORTS.find((airport) => formatAirport(airport).toLowerCase() === normalized);
}

/** Curated airports for Ghana travel agency — domestic, regional, and popular international routes */
export const AIRPORTS: Airport[] = [
  { city: "Accra", country: "Ghana", iata: "ACC", category: "domestic" },
  { city: "Kumasi", country: "Ghana", iata: "KMS", category: "domestic" },
  { city: "Takoradi", country: "Ghana", iata: "TKD", category: "domestic" },
  { city: "Tamale", country: "Ghana", iata: "TML", category: "domestic" },
  { city: "Lagos", country: "Nigeria", iata: "LOS", category: "regional" },
  { city: "Abuja", country: "Nigeria", iata: "ABV", category: "regional" },
  { city: "Abidjan", country: "Côte d'Ivoire", iata: "ABJ", category: "regional" },
  { city: "Dakar", country: "Senegal", iata: "DSS", category: "regional" },
  { city: "Lomé", country: "Togo", iata: "LFW", category: "regional" },
  { city: "Cotonou", country: "Benin", iata: "COO", category: "regional" },
  { city: "Douala", country: "Cameroon", iata: "DLA", category: "regional" },
  { city: "Yaoundé", country: "Cameroon", iata: "NSI", category: "regional" },
  { city: "Nairobi", country: "Kenya", iata: "NBO", category: "regional" },
  { city: "Addis Ababa", country: "Ethiopia", iata: "ADD", category: "regional" },
  { city: "Johannesburg", country: "South Africa", iata: "JNB", category: "regional" },
  { city: "Cape Town", country: "South Africa", iata: "CPT", category: "regional" },
  { city: "Casablanca", country: "Morocco", iata: "CMN", category: "regional" },
  { city: "Cairo", country: "Egypt", iata: "CAI", category: "regional" },
  { city: "Dubai", country: "UAE", iata: "DXB", category: "international" },
  { city: "Abu Dhabi", country: "UAE", iata: "AUH", category: "international" },
  { city: "Doha", country: "Qatar", iata: "DOH", category: "international" },
  { city: "Istanbul", country: "Turkey", iata: "IST", category: "international" },
  { city: "London Heathrow", country: "United Kingdom", iata: "LHR", category: "international" },
  { city: "London Gatwick", country: "United Kingdom", iata: "LGW", category: "international" },
  { city: "Amsterdam", country: "Netherlands", iata: "AMS", category: "international" },
  { city: "Paris", country: "France", iata: "CDG", category: "international" },
  { city: "Frankfurt", country: "Germany", iata: "FRA", category: "international" },
  { city: "Brussels", country: "Belgium", iata: "BRU", category: "international" },
  { city: "New York JFK", country: "United States", iata: "JFK", category: "international" },
  { city: "Washington Dulles", country: "United States", iata: "IAD", category: "international" },
  { city: "Atlanta", country: "United States", iata: "ATL", category: "international" },
  { city: "Toronto", country: "Canada", iata: "YYZ", category: "international" },
  { city: "Beijing", country: "China", iata: "PEK", category: "international" },
  { city: "Guangzhou", country: "China", iata: "CAN", category: "international" },
  { city: "Mumbai", country: "India", iata: "BOM", category: "international" },
  { city: "Delhi", country: "India", iata: "DEL", category: "international" },
  { city: "Bangkok", country: "Thailand", iata: "BKK", category: "international" },
  { city: "Singapore", country: "Singapore", iata: "SIN", category: "international" },
  { city: "Hong Kong", country: "Hong Kong", iata: "HKG", category: "international" },
  { city: "São Paulo", country: "Brazil", iata: "GRU", category: "international" },
  { city: "Rio de Janeiro", country: "Brazil", iata: "GIG", category: "international" },
];
