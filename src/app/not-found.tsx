import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { contactInfo } from "@/lib/content";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Page Not Found",
  description:
    "This page could not be found. Return to Travel Zone Ghana to browse tours and plan your trip.",
  noIndex: true,
  canonical: false,
});

const links = [
  { label: "Home", href: "/" },
  { label: "Tour packages", href: "/tours" },
  { label: "Book a trip", href: "/book" },
  { label: "Contact us", href: "/contact" },
];

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="bg-cream">
        <section className="section-container flex min-h-[70vh] flex-col items-center justify-center py-32 text-center lg:py-40">
          <p className="text-sm font-medium tracking-[0.2em] text-brand-red uppercase">
            Error 404
          </p>
          <h1 className="heading-serif mt-4 text-5xl text-navy sm:text-6xl lg:text-7xl">
            Page not found
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-muted">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved. Head back home or browse our current tour packages.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
            <Link
              href="/tours"
              className="inline-flex items-center justify-center border-2 border-navy px-7 py-3 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
            >
              View tours
            </Link>
          </div>

          <nav className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy/70 hover:text-brand-red"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="mt-10 text-sm text-text-muted">
            Need help? Call{" "}
            <a
              href={`tel:${contactInfo.phoneHrefs[0]}`}
              className="font-semibold text-navy hover:text-brand-red"
            >
              {contactInfo.phones[0]}
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
