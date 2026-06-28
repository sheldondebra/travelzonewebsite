import type { ComponentType } from "react";

type IconProps = {
  className?: string;
};

function AirlineIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2.5 13.5 9 11l8.5 1.5-1-3.5L21 7l-2.5-1-5.5 2L9 5 7.5 8.5l3 1.5-8 2.5Z" />
    </svg>
  );
}

function InsuranceIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 3.2 5 1.9v4.9c0 3.6-2.3 7-5 8.1-2.7-1.1-5-4.5-5-8.1V7.1l5-1.9Z" />
    </svg>
  );
}

function HotelIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 3h12v18H4V3Zm14 4h2v14h-2V7ZM8 8h2v2H8V8Zm4 0h2v2h-2V8ZM8 12h2v2H8v-2Zm4 0h2v2h-2v-2Z" />
    </svg>
  );
}

function CarIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 11l1.2-4.8A2 2 0 0 1 8.1 5h7.8a2 2 0 0 1 1.9 1.2L19 11v7a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-7Zm2.3-4 1 4h7.4l1-4H7.3ZM7 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  );
}

function GroupIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 20a4 4 0 0 1 8 0H3Zm9 0h5a3.5 3.5 0 0 0-7 0h2Z" />
    </svg>
  );
}

function TourIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a6 6 0 0 0-6 6c0 4.5 6 12 6 12s6-7.5 6-12a6 6 0 0 0-6-6Zm0 8.5A2.5 2.5 0 1 1 12 5a2.5 2.5 0 0 1 0 5.5Z" />
    </svg>
  );
}

function AdventureIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3 4 19h16L12 3Zm0 5.5L16.2 17H7.8L12 8.5Z" />
    </svg>
  );
}

function CorporateIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 7V4h8v3h4v15H4V7h4ZM10 6h4V5h-4v1Zm-2 4h2v2H8v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2H8v-2Zm4 0h2v2h-2v-2Z" />
    </svg>
  );
}

const serviceIconMap: Record<string, ComponentType<IconProps>> = {
  "airline-ticketing": AirlineIcon,
  "travel-insurance": InsuranceIcon,
  "hotel-reservations": HotelIcon,
  "car-rentals": CarIcon,
  "group-travel": GroupIcon,
  "tour-packages": TourIcon,
  "adventure-tours": AdventureIcon,
  "corporate-travel": CorporateIcon,
};

const serviceToneMap: Record<string, string> = {
  "airline-ticketing": "bg-card-blue text-navy",
  "travel-insurance": "bg-card-peach text-brand-red",
  "hotel-reservations": "bg-card-lavender text-navy",
  "car-rentals": "bg-card-pink text-navy",
  "group-travel": "bg-card-blue text-accent-teal",
  "tour-packages": "bg-card-peach text-navy",
  "adventure-tours": "bg-card-lavender text-accent-teal",
  "corporate-travel": "bg-card-pink text-brand-red",
};

export function ServiceIcon({
  slug,
  className = "h-6 w-6",
}: {
  slug: string;
  className?: string;
}) {
  const Icon = serviceIconMap[slug] ?? TourIcon;
  return <Icon className={className} />;
}

export function getServiceTone(slug: string) {
  return serviceToneMap[slug] ?? "bg-cream text-navy";
}
