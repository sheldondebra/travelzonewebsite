import { getPublishedBlogPosts } from "@/lib/content";
import { getPublishedTours } from "@/lib/tours";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap() {
  const [tours, blogPosts] = await Promise.all([
    getPublishedTours(),
    getPublishedBlogPosts(),
  ]);
  const lastModified = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/tours", priority: 0.9 },
    { path: "/consultation", priority: 0.9 },
    { path: "/about", priority: 0.8 },
    { path: "/what-we-do", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    { path: "/cookies", priority: 0.5 },
    { path: "/blog", priority: 0.7 },
  ];

  return [
    ...staticRoutes.map(({ path, priority }) => ({
      url: absoluteUrl(path || "/"),
      lastModified,
      changeFrequency: "weekly" as const,
      priority,
    })),
    ...tours.map((tour) => ({
      url: absoluteUrl(`/tours/${tour.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

export const revalidate = 86400;
