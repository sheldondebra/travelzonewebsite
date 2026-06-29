export type Airport = {
  city: string;
  country: string;
  iata: string;
};

export function formatAirport(airport: Airport) {
  return `${airport.city} (${airport.iata})`;
}

export function searchAirports(query: string, limit = 8): Airport[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return AIRPORTS.slice(0, limit);
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

export function findAirportByLabel(label: string): Airport | undefined {
  const normalized = label.trim().toLowerCase();
  return AIRPORTS.find((airport) => formatAirport(airport).toLowerCase() === normalized);
}

/** Curated airports for Ghana travel agency — domestic, regional, and popular international routes */
export const AIRPORTS: Airport[] = [
  { city: "Accra", country: "Ghana", iata: "ACC" },
  { city: "Kumasi", country: "Ghana", iata: "KMS" },
  { city: "Takoradi", country: "Ghana", iata: "TKD" },
  { city: "Tamale", country: "Ghana", iata: "TML" },
  { city: "Lagos", country: "Nigeria", iata: "LOS" },
  { city: "Abuja", country: "Nigeria", iata: "ABV" },
  { city: "Abidjan", country: "Côte d'Ivoire", iata: "ABJ" },
  { city: "Dakar", country: "Senegal", iata: "DSS" },
  { city: "Lomé", country: "Togo", iata: "LFW" },
  { city: "Cotonou", country: "Benin", iata: "COO" },
  { city: "Douala", country: "Cameroon", iata: "DLA" },
  { city: "Yaoundé", country: "Cameroon", iata: "NSI" },
  { city: "Nairobi", country: "Kenya", iata: "NBO" },
  { city: "Addis Ababa", country: "Ethiopia", iata: "ADD" },
  { city: "Johannesburg", country: "South Africa", iata: "JNB" },
  { city: "Cape Town", country: "South Africa", iata: "CPT" },
  { city: "Casablanca", country: "Morocco", iata: "CMN" },
  { city: "Cairo", country: "Egypt", iata: "CAI" },
  { city: "Dubai", country: "UAE", iata: "DXB" },
  { city: "Abu Dhabi", country: "UAE", iata: "AUH" },
  { city: "Doha", country: "Qatar", iata: "DOH" },
  { city: "Istanbul", country: "Turkey", iata: "IST" },
  { city: "London Heathrow", country: "United Kingdom", iata: "LHR" },
  { city: "London Gatwick", country: "United Kingdom", iata: "LGW" },
  { city: "Amsterdam", country: "Netherlands", iata: "AMS" },
  { city: "Paris", country: "France", iata: "CDG" },
  { city: "Frankfurt", country: "Germany", iata: "FRA" },
  { city: "Brussels", country: "Belgium", iata: "BRU" },
  { city: "New York JFK", country: "United States", iata: "JFK" },
  { city: "Washington Dulles", country: "United States", iata: "IAD" },
  { city: "Atlanta", country: "United States", iata: "ATL" },
  { city: "Toronto", country: "Canada", iata: "YYZ" },
  { city: "Beijing", country: "China", iata: "PEK" },
  { city: "Guangzhou", country: "China", iata: "CAN" },
  { city: "Mumbai", country: "India", iata: "BOM" },
  { city: "Delhi", country: "India", iata: "DEL" },
  { city: "Bangkok", country: "Thailand", iata: "BKK" },
  { city: "Singapore", country: "Singapore", iata: "SIN" },
  { city: "Hong Kong", country: "Hong Kong", iata: "HKG" },
  { city: "São Paulo", country: "Brazil", iata: "GRU" },
  { city: "Rio de Janeiro", country: "Brazil", iata: "GIG" },
];
