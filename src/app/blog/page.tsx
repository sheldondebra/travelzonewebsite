import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { BlogPagination } from "@/components/BlogPagination";
import { getPublishedBlogPosts } from "@/lib/content";
import { createMetadata } from "@/lib/seo";

export const revalidate = 3600;

const POSTS_PER_PAGE = 6;

export const metadata: Metadata = createMetadata({
  title: "Travel Blog",
  description:
    "Ghana travel guides and tips from the Travel Zone team — Cape Coast, Kakum, Mole National Park, group trips, and more.",
  path: "/blog",
});

type BlogPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const blogPosts = await getPublishedBlogPosts();
  const featured =
    blogPosts.find((post) => post.category === "Ghana Travel") ?? blogPosts[0];
  const rest = blogPosts.filter((post) => post.slug !== featured?.slug);
  const totalPages = Math.max(1, Math.ceil(rest.length / POSTS_PER_PAGE));

  if (currentPage > totalPages) {
    notFound();
  }

  const pageOffset = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = rest.slice(pageOffset, pageOffset + POSTS_PER_PAGE);
  const showFeatured = currentPage === 1;

  if (!featured) {
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
          <section className="py-20">
            <div className="section-container text-text-muted">
              No blog posts published yet.
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
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

        <section className="py-20 lg:py-28">
          <div className="section-container">
            {showFeatured ? (
              <article className="group grid overflow-hidden rounded-2xl bg-cream lg:grid-cols-2">
                <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[360px]">
                  <Image
                    src={featured.image}
                    alt={featured.title}
                    fill
                    priority
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 lg:p-12">
                  <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-text-muted uppercase">
                    <span>{featured.category}</span>
                    <span>·</span>
                    <time>{featured.date}</time>
                    <span>·</span>
                    <span>{featured.readTime}</span>
                  </div>
                  <h2 className="heading-serif mt-4 text-2xl text-navy lg:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
                    {featured.excerpt}
                  </p>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="mt-6 inline-block text-sm font-semibold text-brand-red hover:underline"
                  >
                    Read Article →
                  </Link>
                </div>
              </article>
            ) : null}

            <div
              className={
                showFeatured
                  ? "mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {paginatedPosts.map((post) => (
                <article
                  key={post.slug}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-text-muted uppercase">
                      <span>{post.category}</span>
                      <span>·</span>
                      <time>{post.date}</time>
                    </div>
                    <h3 className="heading-serif mt-3 text-lg text-navy group-hover:text-brand-red">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                      {post.excerpt}
                    </p>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="mt-4 inline-block text-sm font-semibold text-brand-red hover:underline"
                    >
                      Read More →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <BlogPagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
