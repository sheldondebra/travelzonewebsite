import { contactInfo } from "@/lib/content";
import { socialProfiles } from "@/lib/social";
import { absoluteUrl, getSiteUrl, siteConfig } from "@/lib/seo";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${getSiteUrl()}/#organization`,
    name: siteConfig.name,
    url: getSiteUrl(),
    logo: absoluteUrl("/logo.png"),
    image: absoluteUrl(siteConfig.defaultOgImage),
    description: siteConfig.description,
    telephone: contactInfo.phoneHrefs[0],
    email: contactInfo.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "#2 Boundary Road, East Legon",
      addressLocality: "Accra",
      addressRegion: "Greater Accra",
      addressCountry: "GH",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:30",
        closes: "17:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "14:00",
      },
    ],
    sameAs: socialProfiles.map((profile) => profile.href),
    areaServed: {
      "@type": "Country",
      name: "Ghana",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${getSiteUrl()}/#website`,
    name: siteConfig.name,
    url: getSiteUrl(),
    publisher: {
      "@id": `${getSiteUrl()}/#organization`,
    },
    inLanguage: "en-GH",
  };
}

export function tourJsonLd(tour: {
  slug: string;
  title: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  duration: string;
  location: string;
}) {
  const imageUrl = tour.image.startsWith("http")
    ? tour.image
    : absoluteUrl(tour.image);

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.description,
    image: imageUrl,
    touristType: "Leisure",
    itinerary: {
      "@type": "ItemList",
      name: tour.duration,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/tours/${tour.slug}`),
      price: tour.price,
      priceCurrency: tour.currency,
      availability: "https://schema.org/InStock",
      seller: {
        "@id": `${getSiteUrl()}/#organization`,
      },
    },
    provider: {
      "@id": `${getSiteUrl()}/#organization`,
    },
    areaServed: tour.location,
  };
}

export function blogPostJsonLd(post: {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
}) {
  const imageUrl = post.image.startsWith("http")
    ? post.image
    : absoluteUrl(post.image);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: imageUrl,
    datePublished: new Date(post.date).toISOString(),
    author: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    publisher: {
      "@id": `${getSiteUrl()}/#organization`,
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    articleSection: post.category,
    inLanguage: "en-GH",
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
