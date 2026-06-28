import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { SocialProfileList } from "@/components/SocialLinks";
import { contactInfo } from "@/lib/content";
import { socialLinks, socialTagline } from "@/lib/social";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Contact Us",
  description:
    "Visit Travel Zone at #2 Boundary Road, East Legon, Accra. Call, email, or message us to plan flights, tours, and group travel.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          label="Contact Us"
          title="Let's Plan Your Next Journey"
          description={`Visit our East Legon office, DM us on ${socialLinks.instagram.handle}, or send a message — our team is ready to help.`}
          image="/images/hero/office-consultation.jpg"
          imageAlt="TravelZone team consulting with a client"
        />

        <section className="py-20 lg:py-28">
          <div className="section-container">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <ContactForm />

              <div className="space-y-8">
                <ContactDetails />

                <div className="rounded-2xl bg-white p-8 shadow-sm">
                  <h3 className="heading-serif text-xl text-navy">
                    Prefer to talk first?
                  </h3>
                  <p className="mt-2 text-sm text-text-muted">
                    Book a free consultation with our travel team — in person at
                    our East Legon office or over the phone.
                  </p>
                  <Link href="/consultation" className="btn-primary mt-5 inline-flex">
                    Book a consultation
                  </Link>
                </div>

                <div className="rounded-2xl bg-white p-8 shadow-sm">
                  <h3 className="heading-serif text-xl text-navy">
                    Follow Us
                  </h3>
                  <p className="mt-2 text-sm text-text-muted">
                    {socialTagline} Get deals, packages, and travel tips on our
                    social channels.
                  </p>
                  <div className="mt-5">
                    <SocialProfileList />
                  </div>
                </div>

                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src="/images/about/reception-wide.jpg"
                    alt="TravelZone reception area"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-cream pb-20 lg:pb-28">
          <div className="section-container">
            <h2 className="heading-serif mb-6 text-2xl text-navy">Find Us</h2>
            <div className="overflow-hidden rounded-2xl shadow-sm">
              <iframe
                title="TravelZone office location"
                src={`https://maps.google.com/maps?q=${contactInfo.mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="h-[400px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
