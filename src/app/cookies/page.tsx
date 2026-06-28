import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieSettingsLink } from "@/components/cookies/CookieSettingsLink";
import { cookieCategories } from "@/lib/cookies";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Cookie Policy",
  description:
    "How Travel Zone Ghana uses cookies and how you can manage your preferences.",
  path: "/cookies",
});

export default function CookiePolicyPage() {
  return (
    <>
      <Header />
      <main className="py-32 lg:py-40">
        <div className="section-container max-w-2xl">
          <h1 className="heading-serif text-3xl text-navy lg:text-4xl">Cookie policy</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
            This page explains how Travel Zone uses cookies and similar technologies
            on travelzonegh.com. You can update your choices at any time using{" "}
            <CookieSettingsLink className="font-semibold text-brand-red hover:underline" />.
          </p>

          <div className="mt-10 space-y-6">
            {cookieCategories.map((category) => (
              <section key={category.id}>
                <h2 className="text-sm font-bold text-brand-red uppercase">
                  {category.label}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {category.description}
                </p>
              </section>
            ))}
          </div>

          <p className="mt-10 text-sm text-text-muted">
            Questions?{" "}
            <Link href="/contact" className="font-semibold text-navy hover:text-brand-red">
              Contact us
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
