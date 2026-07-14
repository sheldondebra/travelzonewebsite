import type { BlogPost } from "@/lib/content";
import type { Tour } from "@/lib/tours";

export type ContentStatus = "draft" | "published";

export type AdminTour = Tour & {
  id: string;
  status: ContentStatus;
  updatedAt: string;
};

export type AdminBlogPost = BlogPost & {
  id: string;
  status: ContentStatus;
  bodyHtml: string;
  updatedAt: string;
};

export type TourInput = Tour & {
  status: ContentStatus;
};

export type BlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  image: string;
  category: string;
  readTime: string;
  date: string;
  status: ContentStatus;
};
