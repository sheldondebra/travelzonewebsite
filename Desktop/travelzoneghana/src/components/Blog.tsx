import Image from "next/image";
import Link from "next/link";
import { getPublishedBlogPosts } from "@/lib/content";

export async function Blog() {
  const blogPosts = await getPublishedBlogPosts();
  const [featured, ...posts] = blogPosts;

  if (!featured) return null;

  return (
    <section className="py-20 lg:py-28">
      <div className="section-container">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-brand-red">Travel notes</p>
            <h2 className="heading-serif mt-1 text-3xl text-navy lg:text-4xl">
              Guides & tips
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-brand-red hover:underline"
          >
            View All Articles →
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
          <article className="group overflow-hidden rounded-2xl">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>
            <div className="pt-6">
              <time className="text-xs font-medium tracking-wide text-text-muted uppercase">
                {featured.date}
              </time>
              <h3 className="heading-serif mt-2 text-2xl text-navy lg:text-[1.65rem]">
                {featured.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
                {featured.excerpt}
              </p>
              <Link
                href={`/blog/${featured.slug}`}
                className="mt-4 inline-block text-sm font-semibold text-brand-red hover:underline"
              >
                Read More →
              </Link>
            </div>
          </article>

          <div className="flex flex-col gap-6">
            {posts.slice(0, 3).map((post) => (
              <article
                key={post.slug}
                className="group flex gap-4 border-b border-gray-100 pb-6 last:border-0"
              >
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div>
                  <time className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
                    {post.date}
                  </time>
                  <h3 className="mt-1 text-sm font-semibold leading-snug text-navy group-hover:text-brand-red">
                    {post.title}
                  </h3>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-2 inline-block text-xs font-semibold text-brand-red hover:underline"
                  >
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
