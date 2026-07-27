import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { BookConsultationForm } from "@/components/consultation/BookConsultationForm";
import { DEFAULT_CONSULTATION_AVAILABILITY } from "@/lib/consultation-availability";
import { createMetadata } from "@/lib/seo";
import { getConsultationAvailability } from "@/lib/site-settings";

export const metadata: Metadata = createMetadata({
  title: "Book a Consultation",
  description:
    "Schedule a free travel consultation at Travel Zone Ghana. Meet our consultants in East Legon or book a phone call to plan flights, tours, and group travel.",
  path: "/consultation",
});

export const revalidate = 300;

export default async function ConsultationPage() {
  let availability = DEFAULT_CONSULTATION_AVAILABILITY;

  try {
    availability = await getConsultationAvailability();
  } catch {
    // Keep the booking form usable if settings lookup fails.
  }

  return (
    <>
      <Header />
      <main>
        <PageHero
          label="Free Consultation"
          title="Talk to a Travel Consultant"
          description="Whether you're planning a family holiday, a group trip, or a last-minute flight — pick a date, choose a time, and we'll be ready when you arrive or call."
          image="/images/hero/office-consultation.jpg"
          imageAlt="Travel Zone consultant meeting with a client"
        />

        <section className="bg-cream py-20 lg:py-28">
          <div className="section-container">
            <BookConsultationForm availability={availability} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
