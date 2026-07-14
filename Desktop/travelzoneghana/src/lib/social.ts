export const socialLinks = {
  instagram: {
    label: "Instagram",
    handle: "@travelzonegh",
    href: "https://www.instagram.com/travelzonegh?igsh=b3lwNXE4bTV4dHUz&utm_source=qr",
  },
  tiktok: {
    label: "TikTok",
    handle: "@travelzonegh",
    href: "https://www.tiktok.com/@travelzonegh?_r=1&_t=ZS-978PNGZVNkP",
  },
  facebook: {
    label: "Facebook",
    handle: "Travel Zone",
    href: "https://www.facebook.com/share/16tHzCN6GJ/?mibextid=wwXIfr",
  },
} as const;

export const socialProfiles = Object.values(socialLinks);

/** Public-facing copy aligned with TravelZone social presence */
export const socialTagline =
  "Discover, feel the culture, live the adventure.";

export const socialHighlights = [
  "Tour packages & travel deals posted weekly",
  "Behind-the-scenes from our East Legon office",
  "Ghana destination tips, flight offers & hotel picks",
  "Customer trip highlights and travel inspiration",
];

export const socialCta =
  "Follow @travelzonegh for the latest packages, ticketing offers, and Ghana travel inspiration.";
