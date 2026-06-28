import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { BlogPostCta } from "@/components/BlogPostCta";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/content";
import { createMetadata } from "@/lib/seo";
import { blogPostJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return createMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    ogImage: post.image,
    type: "article",
    publishedTime: new Date(post.date).toISOString(),
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const allPosts = await getPublishedBlogPosts();
  const related = allPosts.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          blogPostJsonLd(post),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <Header />
      <main>
        <section className="relative flex min-h-[45vh] items-end overflow-hidden bg-navy pb-14 pt-32 lg:pt-40">
          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            className="object-cover opacity-50"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40" />

          <div className="relative section-container">
            <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-white/60 uppercase">
              <span>{post.category}</span>
              <span>·</span>
              <time>{post.date}</time>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
            <h1 className="heading-serif mt-4 max-w-3xl text-3xl leading-tight text-white lg:text-5xl">
              {post.title}
            </h1>
          </div>
        </section>

        <article className="py-16 lg:py-24">
          <div className="section-container">
            <div className="mx-auto max-w-3xl">
              <p className="text-lg leading-relaxed text-text-muted">
                {post.excerpt}
              </p>

              {post.bodyHtml ? (
                <div
                  className="prose prose-neutral mt-10 max-w-none space-y-6 text-[16px] leading-[1.85] text-text-muted [&_a]:text-brand-red [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
                />
              ) : (
                <div className="mt-10 space-y-6">
                  {post.content.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="text-[16px] leading-[1.85] text-text-muted"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              <div className="mt-12 border-t border-gray-100 pt-8">
                <Link
                  href="/blog"
                  className="text-sm font-semibold text-brand-red hover:underline"
                >
                  ← Back to Blog
                </Link>
              </div>
            </div>
          </div>
        </article>

        <BlogPostCta />

        <section className="bg-cream py-16 lg:py-24">
          <div className="section-container">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium tracking-[0.14em] text-brand-red uppercase">
                  Keep reading
                </p>
                <h2 className="heading-serif mt-2 text-2xl text-navy lg:text-3xl">
                  More articles
                </h2>
              </div>
              <Link
                href="/blog"
                className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-navy px-6 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
              >
                View all articles
              </Link>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog/${item.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-parchment bg-white transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(12,26,46,0.35)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <span className="absolute top-3 left-3 rounded-[3px] bg-navy/85 px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-text-muted uppercase">
                      <time>{item.date}</time>
                      <span aria-hidden>·</span>
                      <span>{item.readTime}</span>
                    </div>
                    <h3 className="heading-serif mt-2 text-lg leading-snug text-navy transition-colors group-hover:text-brand-red">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-text-muted">
                      {item.excerpt}
                    </p>
                    <span className="mt-4 text-sm font-semibold text-brand-red">
                      Read more →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
