import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { BlogIndex } from "@/components/BlogIndex";
import { getPublishedBlogPosts } from "@/lib/content-public-blog";
import { createMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = createMetadata({
  title: "Travel Blog",
  description:
    "Ghana travel guides and tips from the Travel Zone team — Cape Coast, Kakum, Mole National Park, group trips, and more.",
  path: "/blog",
});

function BlogIndexFallback() {
  return (
    <section className="py-20 lg:py-28" aria-hidden>
      <div className="section-container">
        <div className="grid overflow-hidden rounded-2xl bg-cream lg:grid-cols-2">
          <div className="min-h-[260px] animate-pulse bg-parchment lg:min-h-[360px]" />
          <div className="space-y-4 p-8 lg:p-12">
            <div className="h-4 w-1/3 animate-pulse rounded bg-parchment" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-parchment" />
            <div className="h-16 w-full animate-pulse rounded bg-parchment" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function BlogPage() {
  let blogPosts: Awaited<ReturnType<typeof getPublishedBlogPosts>> = [];

  try {
    blogPosts = await getPublishedBlogPosts();
  } catch {
    blogPosts = [];
  }

  return (
    <>
      <Header />
      <main>
        <PageHero
          label="Blog"
          title="Guides & travel tips"
          description="Notes on Cape Coast, Kakum, Mole, and other trips we organize from our desk."
          image="/images/hero/office-main.jpg"
          imageAlt="TravelZone office"
        />

        <Suspense fallback={<BlogIndexFallback />}>
          <BlogIndex posts={blogPosts} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
