import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/content";
import { createMetadata } from "@/lib/seo";
import { blogPostJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";

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

        <section className="bg-cream py-16 lg:py-20">
          <div className="section-container">
            <h2 className="heading-serif mb-8 text-2xl text-navy">
              More Articles
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog/${item.slug}`}
                  className="group rounded-2xl bg-white p-5 shadow-sm"
                >
                  <time className="text-[11px] font-medium text-text-muted uppercase">
                    {item.date}
                  </time>
                  <h3 className="mt-2 font-semibold text-navy group-hover:text-brand-red">
                    {item.title}
                  </h3>
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
