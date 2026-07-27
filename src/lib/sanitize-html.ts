import sanitizeHtml from "sanitize-html";
import { normalizeHtmlImageUrls } from "@/lib/media-url";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "blockquote",
];

const ALLOWED_ATTR: Record<string, string[]> = {
  a: ["href", "name", "target", "rel", "title"],
  img: ["src", "alt", "title"],
};

/**
 * Server-safe HTML sanitizer (no jsdom).
 * isomorphic-dompurify pulled jsdom into admin/blog and crashed Vercel.
 */
export function sanitizeBlogHtml(html: string): string {
  if (!html.trim()) return "";

  try {
    const sanitized = sanitizeHtml(html, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: ALLOWED_ATTR,
      allowedSchemes: ["http", "https", "mailto"],
      transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
          rel: "noopener noreferrer",
        }),
      },
    }).trim();

    return normalizeHtmlImageUrls(sanitized);
  } catch {
    return "";
  }
}
