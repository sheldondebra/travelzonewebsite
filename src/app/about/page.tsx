import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  AboutHero,
  AboutStats,
  AboutStory,
  AboutTeam,
  AboutServices,
  AboutDestinations,
  AboutGallery,
  AboutCta,
  AboutSustainability,
} from "@/components/about/AboutSections";
import { getPublishedAboutTeamMembers } from "@/lib/about-team-store";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About Us",
  description:
    "Over 20 years of trusted travel and destination management in Ghana. Airline ticketing, tour packages, corporate travel, and curated experiences from East Legon.",
  path: "/about",
});

export default async function AboutPage() {
  const teamMembers = await getPublishedAboutTeamMembers();

  return (
    <>
      <Header />
      <main>
        <AboutHero />
        <AboutStats />
        <AboutStory />
        <AboutTeam members={teamMembers} />
        <AboutServices />
        <AboutDestinations />
        <AboutGallery />
        <AboutCta />
        <AboutSustainability />
      </main>
      <Footer />
    </>
  );
}
