import Image from "next/image";
import Link from "next/link";
import { contactInfo } from "@/lib/content";

const services = [
  "Airline ticketing & reservations",
  "Hotel reservations",
  "Travel insurance",
  "Car rentals",
  "Group travel for schools & churches",
  "Tour packages across Ghana",
  "Organized adventure tours",
  "Corporate travel management",
];

export function ServicesStrip() {
  return (
    <section className="py-20 lg:py-28">
      <div className="section-container">
        <div className="grid items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden lg:aspect-auto lg:min-h-[520px]">
            <Image
              src="/images/about/brochure.jpg"
              alt="TravelZone services brochure"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>

          <div className="lg:pt-6">
            <p className="text-sm font-medium text-brand-red">
              What we actually do
            </p>
            <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-[2.35rem] lg:leading-tight">
              Ticketing, hotels, tours — all from one desk in East Legon.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-text-muted">
              Most people find us when they need a flight booked, a school trip
              organized, or a weekend away to Cape Coast. We handle the
              bookings, the buses, the hotels, and the guides — you tell us
              where you want to go.
            </p>

            <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
              {services.map((item) => (
                <li
                  key={item}
                  className="border-l-2 border-brand-red/40 pl-3 text-sm text-navy"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/what-we-do" className="btn-primary">
                See all services
              </Link>
              <a
                href={`tel:${contactInfo.phoneHrefs[0]}`}
                className="inline-flex items-center justify-center rounded-full border-2 border-navy px-7 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
              >
                Call {contactInfo.phones[0]}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
