import { getPublishedBlogPosts } from "@/lib/content-public-blog";
import { getPublishedTours } from "@/lib/content-public-tours";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSql } from "@/lib/db/postgres";
import { absoluteUrl } from "@/lib/seo";

async function getContentTimestamps() {
  if (!isDatabaseConfigured()) {
    return { tours: new Map<string, string>(), posts: new Map<string, string>() };
  }

  try {
    const sql = getSql();
    const [tourRows, postRows] = await Promise.all([
      sql`select slug, updated_at from public.tours where status = 'published'`,
      sql`select slug, updated_at from public.blog_posts where status = 'published'`,
    ]);

    const tours = new Map<string, string>();
    for (const row of tourRows) {
      if (row.slug && row.updated_at) tours.set(row.slug as string, row.updated_at as string);
    }

    const posts = new Map<string, string>();
    for (const row of postRows) {
      if (row.slug && row.updated_at) posts.set(row.slug as string, row.updated_at as string);
    }

    return { tours, posts };
  } catch {
    return { tours: new Map<string, string>(), posts: new Map<string, string>() };
  }
}

export default async function sitemap() {
  const [tours, blogPosts, timestamps] = await Promise.all([
    getPublishedTours(),
    getPublishedBlogPosts(),
    getContentTimestamps(),
  ]);

  const staticRoutes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/tours", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/tickets", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/consultation", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/what-we-do", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/cookies", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
  ];

  const latestPostUpdate = blogPosts.reduce((latest, post) => {
    const updated = timestamps.posts.get(post.slug) ?? post.updatedAt;
    if (!updated) return latest;
    const time = new Date(updated).getTime();
    return time > latest ? time : latest;
  }, 0);

  const latestTourUpdate = tours.reduce((latest, tour) => {
    const updated = timestamps.tours.get(tour.slug);
    if (!updated) return latest;
    const time = new Date(updated).getTime();
    return time > latest ? time : latest;
  }, 0);

  return [
    ...staticRoutes.map(({ path, priority, changeFrequency }) => ({
      url: absoluteUrl(path || "/"),
      lastModified: new Date(
        path === "/blog" && latestPostUpdate
          ? latestPostUpdate
          : path === "/tours" && latestTourUpdate
            ? latestTourUpdate
            : Date.now(),
      ),
      changeFrequency,
      priority,
    })),
    ...tours.map((tour) => ({
      url: absoluteUrl(`/tours/${tour.slug}`),
      lastModified: new Date(timestamps.tours.get(tour.slug) ?? Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(
        timestamps.posts.get(post.slug) ?? post.updatedAt ?? post.date,
      ),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

export const revalidate = 86400;
