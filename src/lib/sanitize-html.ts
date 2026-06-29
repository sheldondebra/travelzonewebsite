import DOMPurify from "isomorphic-dompurify";
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

const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel"];

export function sanitizeBlogHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
  })
    .replace(/<a /g, '<a rel="noopener noreferrer" ')
    .trim();

  return normalizeHtmlImageUrls(sanitized);
}
