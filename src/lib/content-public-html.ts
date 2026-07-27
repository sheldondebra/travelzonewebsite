/** Shared HTML helpers for public content — keep free of heavy DOM deps. */
export function htmlToParagraphs(html: string): string[] {
  if (!html.trim()) return [];
  const matches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (!matches) return [html.replace(/<[^>]+>/g, "")];
  return matches.map((block) =>
    block.replace(/<\/?p[^>]*>/gi, "").replace(/<[^>]+>/g, "").trim(),
  );
}
