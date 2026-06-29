import Image from "next/image";
import Link from "next/link";
import { PhoneIcon } from "@/components/ContactIcons";
import { getServiceTone, ServiceIcon } from "@/components/ServiceIcons";
import { audiences, contactInfo, processSteps, services } from "@/lib/content";

const highlights = [
  {
    value: "8",
    label: "Core services",
    detail: "Ticketing through corporate travel",
  },
  {
    value: "2004",
    label: "Serving since",
    detail: "Same East Legon office",
  },
  {
    value: "10–500+",
    label: "Group sizes",
    detail: "Schools, churches, corporates",
  },
];

export function WhatWeDoHero() {
  return (
    <section className="relative min-h-[62vh] overflow-hidden bg-navy lg:min-h-[68vh]">
      <Image
        src="/images/hero/office-consultation.jpg"
        alt="Travel Zone team consulting with a client"
        fill
        priority
        className="object-cover opacity-40"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/50" />

      <div className="relative flex min-h-[62vh] flex-col justify-end pb-14 pt-32 lg:min-h-[68vh] lg:pb-20 lg:pt-40">
        <div className="section-container">
          <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-[0.18em] text-brand-red uppercase">
                What we do
              </p>
              <h1 className="heading-serif mt-3 text-[2.5rem] leading-[1.08] text-white sm:text-5xl lg:text-[3.75rem]">
                Everything travel — from one desk in East Legon.
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/75">
                Flights, hotels, insurance, tours, and group logistics. Walk in,
                call, or book online — our consultants handle the details.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/tickets" className="btn-primary">
                  Request tickets
                </Link>
                <Link href="/book" className="btn-outline">
                  Book a tour
                </Link>
                <a
                  href={`tel:${contactInfo.phoneHrefs[0]}`}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-7 py-3 text-sm font-semibold text-white hover:border-white"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {contactInfo.phones[0]}
                </a>
              </div>
            </div>

            <div className="hidden overflow-hidden border border-white/10 lg:block">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/images/about/brochure.jpg"
                  alt="Travel Zone services brochure"
                  fill
                  className="object-cover"
                  sizes="40vw"
                />
              </div>
              <p className="bg-white/5 px-4 py-3 text-xs text-white/60">
                {contactInfo.address} · {contactInfo.hours}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhatWeDoHighlights() {
  return (
    <section className="border-b border-gray-100 bg-white py-12 lg:py-14">
      <div className="section-container">
        <div className="grid gap-8 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.label} className="border-l-2 border-brand-red pl-5">
              <p className="heading-serif text-3xl font-semibold text-navy lg:text-4xl">
                {item.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-navy">{item.label}</p>
              <p className="mt-1 text-xs text-text-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhatWeDoServices() {
  return (
    <section className="py-20 lg:py-28">
      <div className="section-container">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-medium text-brand-red">Our services</p>
            <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
              What we handle for you
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              One team coordinates airlines, hotels, ground transport, guides,
              and paperwork — so you are not juggling vendors on your own.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block text-sm font-semibold text-brand-red hover:underline"
            >
              Ask about a specific service →
            </Link>
          </div>

          <div>
            <div className="mb-8 border-b border-gray-100 pb-8 lg:mb-10">
              <p className="text-xs font-semibold tracking-[0.18em] text-brand-red uppercase">
                Service directory
              </p>
              <h3 className="mt-2 text-xl font-semibold text-navy sm:text-2xl">
                Browse everything we handle
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
                Flights, insurance, hotels, transport, tours, and group logistics —
                each service below is managed by the same Travel Zone team.
              </p>
            </div>

            <div className="space-y-4">
            {services.map((service, index) => (
              <article
                key={service.slug}
                className="group grid gap-5 rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6 sm:p-6"
              >
                <div className="flex items-start gap-4 sm:flex-col sm:items-center sm:gap-3">
                  <span className="text-xs font-bold tracking-[0.2em] text-brand-red/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${getServiceTone(service.slug)}`}
                  >
                    <ServiceIcon slug={service.slug} className="h-7 w-7" />
                  </div>
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-navy">{service.title}</h3>
                  <p className="mt-2 text-sm font-medium text-brand-red">
                    {service.description}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    {service.detail}
                  </p>
                  {service.slug === "airline-ticketing" ? (
                    <Link
                      href="/tickets"
                      className="mt-4 inline-block text-sm font-semibold text-brand-red hover:underline"
                    >
                      Request a flight ticket →
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhatWeDoAudiences() {
  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="section-container">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/4] lg:aspect-auto lg:min-h-[480px]">
            <Image
              src="/images/hero/office-main.jpg"
              alt="Travel Zone office workspace"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-brand-red">Who we serve</p>
            <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
              Built for every kind of traveler
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
              Families booking a holiday get the same attention as a school
              planning a 40-bus excursion. Tell us who is traveling and we
              shape the plan around that.
            </p>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {audiences.map((audience) => (
                <li
                  key={audience.title}
                  className="border border-gray-200/80 bg-white p-5"
                >
                  <h3 className="font-semibold text-navy">{audience.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {audience.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhatWeDoProcess() {
  return (
    <section className="bg-navy py-20 lg:py-28">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-brand-red">How it works</p>
          <h2 className="heading-serif mt-2 text-3xl text-white lg:text-4xl">
            From first conversation to wheels up
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            Most trips start with a call, a walk-in, or a message. We build the
            plan, you approve it, and we handle the bookings.
          </p>
        </div>

        <div className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="absolute top-8 hidden h-px bg-white/15 lg:inset-x-[12%] lg:block" aria-hidden />

          {processSteps.map((item) => (
            <div key={item.step} className="relative text-center lg:text-left">
              <span className="relative z-10 inline-flex h-16 w-16 items-center justify-center border border-brand-red/40 bg-navy heading-serif text-xl font-semibold text-brand-red">
                {item.step}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhatWeDoCta() {
  return (
    <section className="py-20 lg:py-28">
      <div className="section-container">
        <div className="grid items-center gap-10 border border-gray-100 bg-cream px-8 py-12 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-14 lg:py-16">
          <div>
            <h2 className="heading-serif text-3xl text-navy lg:text-4xl">
              Ready to plan something?
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-text-muted">
              Dubai packages, Ghana tours, school trips, or a single flight —
              tell us what you need and we will quote it clearly.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/contact" className="btn-primary text-center">
              Contact us
            </Link>
            <Link
              href="/tours"
              className="inline-flex items-center justify-center border-2 border-navy px-7 py-3 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
            >
              View packages
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
