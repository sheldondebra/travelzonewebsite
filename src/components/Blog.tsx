import Image from "next/image";
import Link from "next/link";
import { getPublishedBlogPosts } from "@/lib/content";

export async function Blog() {
  const blogPosts = await getPublishedBlogPosts();
  const featured =
    blogPosts.find((post) => post.category === "Ghana Travel") ?? blogPosts[0];

  if (!featured) return null;

  const recent = blogPosts
    .filter((post) => post.slug !== featured.slug)
    .slice(0, 3);

  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="section-container">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-[0.14em] text-brand-red uppercase">
              Travel notes
            </p>
            <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
              Guides &amp; tips
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
              Destination guides for Cape Coast, Kakum, Mole, and more — written
              by the team that actually runs these trips from East Legon.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-navy px-7 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
          >
            View all articles
          </Link>
        </div>

        <Link
          href={`/blog/${featured.slug}`}
          className="group mt-10 grid overflow-hidden rounded-2xl bg-navy shadow-[0_24px_60px_-24px_rgba(12,26,46,0.45)] lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="relative isolate min-h-[260px] overflow-hidden lg:min-h-[380px]">
            <Image
              src={featured.image}
              alt={featured.title}
              fill
              priority
              className="z-0 object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
            <div
              className="absolute inset-0 z-[1] bg-gradient-to-t from-navy/85 via-navy/15 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-navy/35"
              aria-hidden
            />
            <span className="absolute top-4 left-4 rounded-[3px] bg-brand-red px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
              Featured
            </span>
          </div>

          <div className="flex flex-col justify-center px-6 py-8 lg:px-10 lg:py-12">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold tracking-[0.14em] text-white/55 uppercase">
              <span>{featured.category}</span>
              <span aria-hidden>·</span>
              <time>{featured.date}</time>
              <span aria-hidden>·</span>
              <span>{featured.readTime}</span>
            </div>
            <h3 className="heading-serif mt-4 text-2xl leading-snug text-white lg:text-[1.85rem]">
              {featured.title}
            </h3>
            <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-white/72">
              {featured.excerpt}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors group-hover:text-brand-red">
              Read article
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </Link>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recent.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-parchment bg-white transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(12,26,46,0.35)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span className="absolute top-3 left-3 rounded-[3px] bg-navy/85 px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
                  {post.category}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-text-muted uppercase">
                  <time>{post.date}</time>
                  <span aria-hidden>·</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="heading-serif mt-2 text-lg leading-snug text-navy transition-colors group-hover:text-brand-red">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-text-muted">
                  {post.excerpt}
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
  );
}
