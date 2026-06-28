import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import {
  TourDetailAssurance,
  TourDetailBooking,
  TourDetailExperiences,
  TourDetailFacts,
  TourDetailGoodToKnow,
  TourDetailHero,
  TourDetailInclusions,
  TourDetailOverview,
} from "@/components/tours/TourDetailSections";
import { getPublishedTours, getTourBySlug } from "@/lib/tours";
import { isPaystackConfiguredAsync } from "@/lib/payment-config";
import { createMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, tourJsonLd } from "@/lib/structured-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const tours = await getPublishedTours();
  return tours.map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return { title: "Tour Not Found" };

  return createMetadata({
    title: tour.title,
    description: `${tour.description} ${tour.duration}. From USD ${tour.price.toLocaleString()} per person. Book with Travel Zone Ghana.`,
    path: `/tours/${tour.slug}`,
    ogImage: tour.image,
  });
}

export default async function TourDetailPage({ params }: Props) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const paymentsReady = await isPaystackConfiguredAsync();

  return (
    <>
      <JsonLd
        data={[
          tourJsonLd(tour),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tours", path: "/tours" },
            { name: tour.title, path: `/tours/${tour.slug}` },
          ]),
        ]}
      />
      <Header />
      <main>
        <TourDetailHero tour={tour} />
        <TourDetailFacts tour={tour} />

        <section className="py-16 lg:py-24">
          <div className="section-container">
            <div className="grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
              <div>
                <TourDetailOverview tour={tour} />
                <TourDetailGoodToKnow tour={tour} />
              </div>
              <TourDetailBooking
                tour={tour}
                paymentsReady={paymentsReady}
              />
            </div>
          </div>
        </section>

        <TourDetailExperiences tour={tour} />
        <TourDetailInclusions tour={tour} />
        <TourDetailAssurance />
        <NewsletterSignup />
      </main>
      <Footer />
    </>
  );
}
