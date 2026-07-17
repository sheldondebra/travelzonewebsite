"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function BlogPostError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Header />
      <main className="py-24">
        <div className="section-container max-w-xl">
          <p className="text-sm font-medium text-brand-red">Travel blog</p>
          <h1 className="heading-serif mt-2 text-3xl text-navy">Couldn&apos;t load this article</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
            Something went wrong while loading this post. Try again or browse all articles.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="btn-primary">
              Try again
            </button>
            <Link href="/blog" className="btn-outline">
              All articles
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
