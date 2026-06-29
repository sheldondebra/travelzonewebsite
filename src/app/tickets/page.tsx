import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { TicketRequestForm } from "@/components/tickets/TicketRequestForm";
import {
  TicketsHighlights,
  TicketsIntro,
  TicketsOfferings,
  TicketsProcess,
  TicketsRequestSection,
  TicketsSidebar,
} from "@/components/tickets/TicketsPageSections";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Flight Tickets & Airline Booking",
  description:
    "Book domestic and international flights with Travel Zone Ghana. Real consultants, competitive fares, and full ticketing support from our East Legon office.",
  path: "/tickets",
});

export default function TicketsPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          label="Airline Ticketing"
          title="Flights booked by people, not bots"
          description="Domestic, regional, and international tickets from our East Legon desk. We search fares, send you options, and issue your ticket — you pay offline when you're ready."
          image="/images/hero/travel-wall.jpg"
          imageAlt="Travel Zone airline ticketing service"
        />

        <TicketsHighlights />
        <TicketsIntro />
        <TicketsOfferings />
        <TicketsProcess />

        <TicketsRequestSection>
          <TicketRequestForm />
          <TicketsSidebar />
        </TicketsRequestSection>
      </main>
      <Footer />
    </>
  );
}
