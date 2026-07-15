import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { ClockIcon, MapPinIcon, PhoneIcon } from "@/components/ContactIcons";
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

        <section className="bg-cream py-20 lg:py-28">
          <div className="section-container">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-brand-red">Visit the office</p>
              <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">Find Us</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
                Our desk is on Boundary Road in East Legon. Walk in during office hours for
                brochures, fare quotes, or to plan a trip in person.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-start lg:gap-10">
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="space-y-6">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-brand-red uppercase">
                      <MapPinIcon className="h-4 w-4 shrink-0" />
                      Office address
                    </p>
                    <p className="mt-2 text-[15px] font-medium leading-relaxed text-navy">
                      {contactInfo.address}
                    </p>
                  </div>

                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-brand-red uppercase">
                      <ClockIcon className="h-4 w-4 shrink-0" />
                      Office hours
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-navy">{contactInfo.hours}</p>
                  </div>

                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-brand-red uppercase">
                      <PhoneIcon className="h-4 w-4 shrink-0" />
                      Call ahead
                    </p>
                    <div className="mt-2 space-y-1">
                      {contactInfo.phones.map((phone, index) => (
                        <a
                          key={phone}
                          href={`tel:${contactInfo.phoneHrefs[index]}`}
                          className="block text-[15px] font-medium text-navy hover:text-brand-red"
                        >
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  href={contactInfo.mapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-8 inline-flex w-full justify-center sm:w-auto"
                >
                  Get directions
                </Link>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                <iframe
                  title="Travel Zone office location — TRAVELZONE LTD, East Legon"
                  src={contactInfo.mapEmbedUrl}
                  className="h-[320px] w-full border-0 sm:h-[380px] lg:h-[420px]"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
                <div className="border-t border-gray-100 px-5 py-4">
                  <Link
                    href={contactInfo.mapDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-brand-red hover:underline"
                  >
                    Open in Google Maps →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
