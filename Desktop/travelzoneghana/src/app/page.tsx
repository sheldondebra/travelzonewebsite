import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TrustBanner } from "@/components/TrustBanner";
import { StatsAbout } from "@/components/StatsAbout";
import { WhyUs } from "@/components/WhyUs";
import { ServicesStrip } from "@/components/ServicesStrip";
import { OfficeCta } from "@/components/OfficeCta";
import { PopularTours } from "@/components/PopularTours";
import { Testimonials } from "@/components/Testimonials";
import { Blog } from "@/components/Blog";
import { SocialFollow } from "@/components/SocialFollow";
import { Footer } from "@/components/Footer";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Travel Agency in East Legon, Accra",
  description:
    "Book flights, hotels, tours, and travel insurance with Travel Zone Ghana. Walk-in office on Boundary Road, East Legon — trusted since 2004.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBanner />
        <StatsAbout />
        <WhyUs />
        <ServicesStrip />
        <PopularTours />
        <Testimonials />
        <OfficeCta />
        <Blog />
        <SocialFollow />
      </main>
      <Footer />
    </>
  );
}
