export type HeroCtaStyle = "primary" | "secondary";

export type HeroCta = {
  label: string;
  href: string;
  style: HeroCtaStyle;
};

export type HeroSlide = {
  imageUrl: string;
  imageAlt: string;
  eyebrow: string;
  headline: string;
  body: string;
  ctas: HeroCta[];
};

export type AdminHeroSlide = HeroSlide & {
  id: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export type HeroSlideInput = {
  id?: string;
  imageUrl: string;
  imageAlt: string;
  eyebrow: string;
  headline: string;
  body: string;
  ctas: HeroCta[];
  sortOrder: number;
  isActive: boolean;
};

export const DEFAULT_HERO_CTAS: HeroCta[] = [
  { label: "Book a trip", href: "/book", style: "primary" },
  { label: "Book a consultation", href: "/consultation", style: "secondary" },
  { label: "View packages", href: "/tours", style: "secondary" },
];

export const fallbackHeroSlides: HeroSlide[] = [
  {
    imageUrl: "/images/hero/office-consultation.jpg",
    imageAlt: "TravelZone team consulting with a client in our East Legon office",
    eyebrow: "#2 Boundary Road · East Legon · Accra",
    headline: "Experience Ghana with Travel Zone.",
    body: "Flights, hotels, tour packages, and group travel — booked from our office or over the phone. Walk in anytime during office hours.",
    ctas: DEFAULT_HERO_CTAS,
  },
  {
    imageUrl: "/images/hero/office-main.jpg",
    imageAlt: "TravelZone office interior with branded glass partitions",
    eyebrow: "#2 Boundary Road · East Legon · Accra",
    headline: "Experience Ghana with Travel Zone.",
    body: "Flights, hotels, tour packages, and group travel — booked from our office or over the phone. Walk in anytime during office hours.",
    ctas: DEFAULT_HERO_CTAS,
  },
  {
    imageUrl: "/images/hero/reception.jpg",
    imageAlt: "TravelZone reception area in East Legon, Accra",
    eyebrow: "#2 Boundary Road · East Legon · Accra",
    headline: "Experience Ghana with Travel Zone.",
    body: "Flights, hotels, tour packages, and group travel — booked from our office or over the phone. Walk in anytime during office hours.",
    ctas: DEFAULT_HERO_CTAS,
  },
  {
    imageUrl: "/images/hero/travel-wall.jpg",
    imageAlt: "TravelZone branded travel consultation space",
    eyebrow: "#2 Boundary Road · East Legon · Accra",
    headline: "Experience Ghana with Travel Zone.",
    body: "Flights, hotels, tour packages, and group travel — booked from our office or over the phone. Walk in anytime during office hours.",
    ctas: DEFAULT_HERO_CTAS,
  },
];

export const DEFAULT_HERO_SLIDE_IDS = [
  "b1111111-1111-4111-8111-111111111101",
  "b1111111-1111-4111-8111-111111111102",
  "b1111111-1111-4111-8111-111111111103",
  "b1111111-1111-4111-8111-111111111104",
] as const;

export function isHeroCtaStyle(value: string): value is HeroCtaStyle {
  return value === "primary" || value === "secondary";
}

export function normalizeHeroCtas(value: unknown): HeroCta[] {
  if (!Array.isArray(value)) return [];

  const ctas: HeroCta[] = [];
  for (const item of value.slice(0, 3)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const label = String(record.label ?? "").trim();
    const href = String(record.href ?? "").trim();
    const styleRaw = String(record.style ?? "secondary");
    if (!label || !href) continue;
    ctas.push({
      label,
      href,
      style: isHeroCtaStyle(styleRaw) ? styleRaw : "secondary",
    });
  }
  return ctas;
}
