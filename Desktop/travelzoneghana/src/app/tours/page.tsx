import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { TourCard } from "@/components/tours/TourCard";
import { getPublishedTours } from "@/lib/tours";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Tour Packages",
  description:
    "Book the Dubai Summer Getaway — 4 nights, visa, breakfast, city tour, desert safari, and marina cruise. Travel Zone Ghana, East Legon.",
  path: "/tours",
  ogImage:
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
});

export default async function ToursPage() {
  const tours = await getPublishedTours();

  return (
    <>
      <Header />
      <main>
        <PageHero
          label="Tour Packages"
          title="Summer in Dubai"
          description="4 nights, 5 days — city tours, desert safari, marina cruise, visa and breakfast included."
          image="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
          imageAlt="Dubai skyline"
        />

        <section className="py-20 lg:py-28">
          <div className="section-container">
            <div className="mb-10 max-w-xl">
              <h2 className="heading-serif text-3xl text-navy">Current package</h2>
              <p className="mt-2 text-[15px] text-text-muted">
                Travel period June – August. Starting from USD 1,500 per person
                on double sharing.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:max-w-2xl">
              {tours.map((tour) => (
                <TourCard key={tour.slug} tour={tour} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
