import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  BookAssurance,
  BookHero,
  BookStepsStrip,
} from "@/components/tours/BookPageSections";
import { BookTripFlow } from "@/components/tours/BookTripFlow";
import { getPublishedTours, getTourBySlug } from "@/lib/content-public-tours";
import { isPaystackConfiguredAsync } from "@/lib/payment-config";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Book a Trip",
  description:
    "Select a tour package, enter your details, and pay securely online with Paystack. Travel Zone Ghana — East Legon, Accra.",
  path: "/book",
  noIndex: true,
});

type Props = {
  searchParams: Promise<{ tour?: string }>;
};

export default async function BookPage({ searchParams }: Props) {
  const { tour: tourSlug } = await searchParams;

  let tours: Awaited<ReturnType<typeof getPublishedTours>> = [];
  let initialSlug: string | undefined;
  let paymentsReady = false;

  try {
    tours = await getPublishedTours();
    initialSlug =
      tourSlug && (await getTourBySlug(tourSlug)) ? tourSlug : undefined;
  } catch {
    tours = [];
  }

  try {
    paymentsReady = await isPaystackConfiguredAsync();
  } catch {
    paymentsReady = false;
  }

  return (
    <>
      <Header />
      <main>
        <BookHero />
        <BookStepsStrip />

        <section className="py-16 lg:py-24">
          <div className="section-container">
            <BookTripFlow
              tours={tours}
              initialSlug={initialSlug}
              paymentsReady={paymentsReady}
            />
          </div>
        </section>

        <BookAssurance />
      </main>
      <Footer />
    </>
  );
}
