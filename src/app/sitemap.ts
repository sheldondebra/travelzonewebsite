import { getPublishedBlogPosts } from "@/lib/content";
import { getPublishedTours } from "@/lib/tours";
import { absoluteUrl } from "@/lib/seo";
import { isSupabaseConfigured, getSupabaseEnv } from "@/lib/supabase/config";
import { createClient as createSupabaseJs } from "@supabase/supabase-js";

async function getContentTimestamps() {
  if (!isSupabaseConfigured()) {
    return { tours: new Map<string, string>(), posts: new Map<string, string>() };
  }

  const env = getSupabaseEnv();
  if (!env) {
    return { tours: new Map<string, string>(), posts: new Map<string, string>() };
  }

  const client = createSupabaseJs(env.url, env.anonKey);
  const [toursResult, postsResult] = await Promise.all([
    client.from("tours").select("slug, updated_at").eq("status", "published"),
    client.from("blog_posts").select("slug, updated_at").eq("status", "published"),
  ]);

  const tours = new Map<string, string>();
  for (const row of toursResult.data ?? []) {
    if (row.slug && row.updated_at) tours.set(row.slug, row.updated_at);
  }

  const posts = new Map<string, string>();
  for (const row of postsResult.data ?? []) {
    if (row.slug && row.updated_at) posts.set(row.slug, row.updated_at);
  }

  return { tours, posts };
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
