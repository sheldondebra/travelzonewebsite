import type { Metadata } from "next";
import {
  canProxyShareImage,
  ogImagePath,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
} from "@/lib/og-image";

export const siteConfig = {
  name: "Travel Zone Ghana",
  shortName: "Travel Zone",
  description:
    "Flights, hotels, travel insurance, and tour packages from Travel Zone on Boundary Road, East Legon, Accra. Serving Ghana since 2004.",
  locale: "en_GH",
  defaultOgImage: "/images/hero/office-main.jpg",
  twitterHandle: "@travelzonegh",
} as const;

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.APP_URL ??
    "https://www.travelzonegh.org";

  const normalized = raw.replace(/\/$/, "");

  try {
    const parsed = new URL(normalized);
    // Apex travelzonegh.org is not served on Vercel (404s pages + /media).
    // Share crawlers (WhatsApp/Facebook) fetch og:image from this host and get no thumbnail.
    if (parsed.hostname === "travelzonegh.org") {
      parsed.hostname = "www.travelzonegh.org";
      return parsed.origin;
    }
  } catch {
    // keep normalized string below
  }

  return normalized;
}

/** Absolute URL for an image stored locally or on a remote host. */
export function absoluteMediaUrl(image: string) {
  const trimmed = image.trim();
  if (!trimmed) return absoluteUrl(siteConfig.defaultOgImage);

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname === "travelzonegh.org") {
        parsed.hostname = "www.travelzonegh.org";
      }
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  return absoluteUrl(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
}

/**
 * Absolute URL safe for Open Graph / Twitter link previews. Featured images are
 * re-encoded as JPEG at 1200x630 because WhatsApp ignores WebP thumbnails and
 * falls back to the site favicon.
 */
export function absoluteShareImageUrl(image: string) {
  const trimmed = image.trim() || siteConfig.defaultOgImage;
  if (!canProxyShareImage(trimmed)) return absoluteMediaUrl(trimmed);
  return absoluteUrl(ogImagePath(trimmed));
}

export function absoluteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized === "/" ? "" : normalized}`;
}

type CreateMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
  canonical?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

export function createMetadata({
  title,
  description,
  path = "/",
  ogImage = siteConfig.defaultOgImage,
  noIndex = false,
  canonical = true,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
}: CreateMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteShareImageUrl(ogImage);

  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical: url } } : {}),
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      ...(type === "article"
        ? {
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(authors?.length ? { authors } : {}),
          }
        : {}),
      images: [
        {
          url: imageUrl,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          type: OG_IMAGE_TYPE,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
    },
  };
}

const defaultOgImageUrl = absoluteShareImageUrl(siteConfig.defaultOgImage);

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.shortName} | East Legon, Accra`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: getSiteUrl(),
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: defaultOgImageUrl,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        type: OG_IMAGE_TYPE,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: siteConfig.twitterHandle,
    images: [defaultOgImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: getSiteUrl(),
  },
};
