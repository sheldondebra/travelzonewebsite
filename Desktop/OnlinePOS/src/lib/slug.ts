export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
) {
  let slug = slugify(base);
  let n = 0;
  while (await exists(slug)) {
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
  return slug;
}
