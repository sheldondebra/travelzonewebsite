import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { BookConsultationForm } from "@/components/consultation/BookConsultationForm";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Book a Consultation",
  description:
    "Schedule a free travel consultation at Travel Zone Ghana. Meet our consultants in East Legon or book a phone call to plan flights, tours, and group travel.",
  path: "/consultation",
});

export default function ConsultationPage() {
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
            <BookConsultationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
