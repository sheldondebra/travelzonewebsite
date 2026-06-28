import Image from "next/image";
import Link from "next/link";
import { PhoneIcon } from "@/components/ContactIcons";
import { BookTourForm } from "@/components/tours/BookTourForm";
import { contactInfo } from "@/lib/content";
import type { Tour } from "@/lib/tours";
import { formatTourPrice } from "@/lib/tours";

type TourSectionProps = {
  tour: Tour;
};

type TourBookingProps = TourSectionProps & {
  paymentsReady: boolean;
};

function destinationLabel(location: string) {
  return location.split(",")[0]?.trim() || location;
}

function experienceDetail(highlight: string) {
  const text = highlight.toLowerCase();
  if (text.includes("city tour")) {
    return "See the skyline, heritage districts, and landmarks with a guided shared tour.";
  }
  if (text.includes("cruise") || text.includes("dhow")) {
    return "Evening on the water — relaxed pace, marina views, and a classic Dubai experience.";
  }
  if (text.includes("desert") || text.includes("safari")) {
    return "Dune bashing, desert camp, and BBQ dinner under the stars.";
  }
  if (text.includes("transfer")) {
    return "Private transfers between airport and hotel, both ways.";
  }
  if (text.includes("meet") || text.includes("check-in")) {
    return "On-ground support from arrival through hotel check-in.";
  }
  return "Included as part of your package itinerary.";
}

export function TourDetailHero({ tour }: TourSectionProps) {
  return (
    <section className="relative min-h-[68vh] overflow-hidden bg-navy lg:min-h-[72vh]">
      <Image
        src={tour.image}
        alt={tour.title}
        fill
        priority
        className="object-cover opacity-50"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/40" />

      <div className="relative flex min-h-[68vh] flex-col justify-end pb-14 pt-32 lg:min-h-[72vh] lg:pb-20 lg:pt-40">
        <div className="section-container">
          <nav className="mb-6 text-xs text-white/50" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden>·</li>
              <li>
                <Link href="/tours" className="hover:text-white">
                  Tours
                </Link>
              </li>
              <li aria-hidden>·</li>
              <li className="text-white/80">{tour.title}</li>
            </ol>
          </nav>

          <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-[0.14em] text-brand-red uppercase">
                {tour.tagline}
              </p>
              <h1 className="heading-serif mt-3 text-[2.35rem] leading-[1.08] text-white sm:text-5xl lg:text-[3.5rem]">
                {tour.title}
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/75">
                {tour.description}
              </p>

              <ul className="mt-8 flex flex-wrap gap-2">
                {[
                  tour.duration,
                  tour.location,
                  `Travel: ${tour.travelPeriod}`,
                  tour.category,
                ].map((item) => (
                  <li
                    key={item}
                    className="border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-white/15 bg-white/5 p-6 backdrop-blur-sm lg:p-8">
              <p className="text-xs font-medium tracking-wide text-white/50 uppercase">
                Package from
              </p>
              <p className="heading-serif mt-2 text-3xl font-semibold text-white lg:text-4xl">
                {formatTourPrice(tour)}
              </p>
              <p className="mt-2 text-sm text-white/60">
                Visa, breakfast, tours & transfers included
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a href="#book" className="btn-primary text-center">
                  Book this trip
                </a>
                <a
                  href={`tel:${contactInfo.phoneHrefs[0]}`}
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white hover:border-white"
                >
                  <PhoneIcon className="h-4 w-4" />
                  Call to enquire
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TourDetailFacts({ tour }: TourSectionProps) {
  const facts = [
    { label: "Duration", value: tour.duration },
    { label: "Travel period", value: tour.travelPeriod },
    { label: "Destination", value: tour.location },
    { label: "Basis", value: "Double sharing · SIC tours" },
  ];

  return (
    <section className="border-b border-gray-100 bg-white py-10 lg:py-12">
      <div className="section-container">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="border-l-2 border-brand-red pl-4">
              <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                {fact.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-navy">{fact.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TourDetailOverview({ tour }: TourSectionProps) {
  const [lead, ...rest] = tour.overview;

  return (
    <div>
      <p className="text-sm font-medium text-brand-red">Overview</p>
      <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
        {destinationLabel(tour.location)}, handled end to end
      </h2>

      {lead && (
        <p className="mt-6 text-lg leading-relaxed text-navy">{lead}</p>
      )}
      {rest.map((paragraph) => (
        <p
          key={paragraph.slice(0, 48)}
          className="mt-4 text-[15px] leading-[1.85] text-text-muted"
        >
          {paragraph}
        </p>
      ))}

      <div className="mt-10 grid gap-3 sm:grid-cols-12">
        {tour.gallery.map((src, i) => (
          <div
            key={src}
            className={`relative overflow-hidden ${
              i === 0
                ? "aspect-[16/10] sm:col-span-8 sm:row-span-2 sm:aspect-auto sm:min-h-[320px]"
                : "aspect-[4/3] sm:col-span-4"
            }`}
          >
            <Image
              src={src}
              alt={`${tour.title} — photo ${i + 1}`}
              fill
              className="object-cover"
              sizes={
                i === 0
                  ? "(max-width: 640px) 100vw, 55vw"
                  : "(max-width: 640px) 100vw, 25vw"
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TourDetailExperiences({ tour }: TourSectionProps) {
  return (
    <section className="bg-navy py-20 lg:py-28">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-brand-red">Experiences</p>
          <h2 className="heading-serif mt-2 text-3xl text-white lg:text-4xl">
            What is included on the ground
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Tours and activities run on a shared (SIC) basis unless noted
            otherwise — a cost-effective way to explore with a guide.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tour.highlights.map((item, index) => (
            <article
              key={item}
              className="border border-white/10 bg-white/5 p-6 lg:p-7"
            >
              <span className="text-xs font-bold tracking-widest text-brand-red/80">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-white">{item}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {experienceDetail(item)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TourDetailInclusions({ tour }: TourSectionProps) {
  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="section-container">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium text-brand-red">Inclusions</p>
            <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
              Everything in the package
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              No hidden visa fees or dirham charges — they are covered. You
              focus on packing; we handle the paperwork and bookings.
            </p>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {tour.included.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 border border-gray-200/80 bg-white px-4 py-3.5 text-sm text-navy"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-brand-red text-xs font-bold text-white">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function TourDetailGoodToKnow({ tour }: TourSectionProps) {
  return (
    <div className="border-t border-gray-100 pt-12">
      <p className="text-sm font-medium text-brand-red">Good to know</p>
      <h2 className="heading-serif mt-2 text-2xl text-navy lg:text-3xl">
        Before you book
      </h2>

      <dl className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="border border-gray-100 bg-cream p-5">
          <dt className="text-sm font-semibold text-navy">Duration</dt>
          <dd className="mt-2 text-sm leading-relaxed text-text-muted">
            {tour.duration}. Exact day-by-day schedule confirmed at booking.
          </dd>
        </div>
        <div className="border border-gray-100 bg-cream p-5">
          <dt className="text-sm font-semibold text-navy">Travel period</dt>
          <dd className="mt-2 text-sm leading-relaxed text-text-muted">
            Departures available {tour.travelPeriod}. Pick your preferred start
            date when booking.
          </dd>
        </div>
        <div className="border border-gray-100 bg-cream p-5">
          <dt className="text-sm font-semibold text-navy">Price</dt>
          <dd className="mt-2 text-sm leading-relaxed text-text-muted">
            From {formatTourPrice(tour)}. Final fare confirmed at booking based
            on availability and room type.
          </dd>
        </div>
        <div className="border border-gray-100 bg-cream p-5">
          <dt className="text-sm font-semibold text-navy">SIC tours</dt>
          <dd className="mt-2 text-sm leading-relaxed text-text-muted">
            Seat-in-coach shared tours with other travelers — a cost-effective
            way to see Dubai with a guide.
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function TourDetailBooking({
  tour,
  paymentsReady,
}: TourBookingProps) {
  return (
    <aside id="book" className="lg:sticky lg:top-28 lg:self-start">
      <div className="mb-4 overflow-hidden border border-gray-100">
        <div className="relative aspect-[16/9]">
          <Image
            src={tour.image}
            alt=""
            fill
            className="object-cover"
            sizes="400px"
          />
        </div>
        <div className="bg-navy px-5 py-4">
          <p className="text-xs text-white/50 uppercase">{tour.duration}</p>
          <p className="heading-serif mt-1 text-xl text-white">{tour.title}</p>
          <p className="mt-1 text-sm font-medium text-brand-red">
            From {formatTourPrice(tour)}
          </p>
        </div>
      </div>

      <BookTourForm tour={tour} paymentsReady={paymentsReady} />
    </aside>
  );
}

export function TourDetailAssurance() {
  return (
    <section className="border-t border-gray-100 py-16 lg:py-20">
      <div className="section-container">
        <div className="grid items-center gap-8 border border-gray-100 bg-white px-8 py-10 lg:grid-cols-[1fr_auto] lg:gap-12 lg:px-12">
          <div>
            <h2 className="heading-serif text-2xl text-navy lg:text-3xl">
              Questions before you pay?
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-text-muted">
              Talk to our consultants at the East Legon office. We can walk
              through dates, passport requirements, and room options before you
              commit online.
            </p>
            <p className="mt-2 text-xs text-text-muted">
              {contactInfo.address} · {contactInfo.hours}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={`tel:${contactInfo.phoneHrefs[0]}`}
              className="inline-flex items-center justify-center gap-2 bg-navy px-7 py-3.5 text-sm font-semibold text-white hover:bg-navy/90"
            >
              <PhoneIcon className="h-4 w-4" />
              {contactInfo.phones[0]}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border-2 border-navy px-7 py-3.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
            >
              Send a message
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
