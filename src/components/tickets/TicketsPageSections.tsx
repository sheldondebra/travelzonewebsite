import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PhoneIcon } from "@/components/ContactIcons";
import { ServiceIcon, getServiceTone } from "@/components/ServiceIcons";
import { contactInfo, services, ticketingPage } from "@/lib/content";

const airlineService = services.find((service) => service.slug === "airline-ticketing");

export function TicketsHighlights() {
  return (
    <section className="border-b border-gray-100 bg-white py-12 lg:py-14">
      <div className="section-container">
        <div className="grid gap-8 sm:grid-cols-3">
          {ticketingPage.highlights.map((item) => (
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

export function TicketsIntro() {
  return (
    <section className="py-20 lg:py-28">
      <div className="section-container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-medium text-brand-red">Why book with us</p>
            <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
              Airline ticketing from people who actually travel
            </h2>
            {airlineService ? (
              <p className="mt-5 text-[15px] leading-relaxed text-text-muted">
                {airlineService.detail}
              </p>
            ) : null}
            <ul className="mt-8 space-y-3">
              {ticketingPage.reasons.map((reason) => (
                <li key={reason} className="flex gap-3 text-sm leading-relaxed text-navy">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" />
                  {reason}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#request-form" className="btn-primary">
                Request a ticket
              </a>
              <a
                href={`tel:${contactInfo.phoneHrefs[0]}`}
                className="inline-flex items-center gap-2 rounded-full border-2 border-navy/15 px-7 py-3 text-sm font-semibold text-navy hover:border-brand-red hover:text-brand-red"
              >
                <PhoneIcon className="h-4 w-4" />
                {contactInfo.phones[0]}
              </a>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/images/hero/travel-wall.jpg"
              alt="Travel Zone airline ticketing desk"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function TicketsOfferings() {
  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="section-container">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-red">What we sell</p>
          <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
            Every kind of flight ticket, one trusted desk
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            From a single economy seat to a full group block — we source, price, and issue tickets
            across domestic, regional, and long-haul routes. You get options, not algorithms.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ticketingPage.offerings.map((item, index) => (
            <article
              key={item.title}
              className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="text-xs font-bold tracking-[0.2em] text-brand-red/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-navy">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${getServiceTone("airline-ticketing")}`}
              >
                <ServiceIcon slug="airline-ticketing" className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-navy">Popular routes from Accra</h3>
                <p className="mt-1 text-sm text-text-muted">
                  We book these daily — and hundreds of other city pairs worldwide.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ticketingPage.popularRoutes.map((route) => (
                <span
                  key={route}
                  className="rounded-full border border-gray-200 bg-cream px-3 py-1.5 text-xs font-semibold text-navy"
                >
                  {route}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TicketsProcess() {
  return (
    <section className="py-20 lg:py-28">
      <div className="section-container">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-medium text-brand-red">How it works</p>
            <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
              We handle the booking — you fly
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              No instant checkout or hidden fees online. Submit your trip, review our quote, and
              pay when you&apos;re ready. That&apos;s how ticketing works when you want a real
              agent in your corner.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {ticketingPage.process.map((step) => (
              <article
                key={step.step}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-bold tracking-[0.2em] text-brand-red">{step.step}</p>
                <h3 className="mt-3 text-lg font-semibold text-navy">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TicketsRequestSection({ children }: { children: React.ReactNode }) {
  return (
    <section id="request-form" className="scroll-mt-28 bg-cream py-14 lg:py-20">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-brand-red">Start your request</p>
          <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
            Tell us where you&apos;re flying
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Fill in your route and dates below. A Travel Zone consultant will search fares and
            contact you with options — usually within one business day.
          </p>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-12">
          {children}
        </div>
      </div>
    </section>
  );
}

export function TicketsSidebar() {
  return (
    <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-2xl bg-navy p-8 text-white">
        <h3 className="heading-serif text-xl">Walk in or call</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          Prefer to talk through your trip first? Visit our East Legon office during business hours
          or call — same team, same fares, no form required.
        </p>
        <ul className="mt-6 flex flex-col gap-2.5">
          {contactInfo.phones.map((phone, index) => (
            <li key={phone}>
              <a
                href={`tel:${contactInfo.phoneHrefs[index]}`}
                className="flex items-center gap-2.5 text-sm font-semibold text-white transition-colors hover:text-brand-red"
              >
                <PhoneIcon className="h-4 w-4 shrink-0 text-brand-red" />
                {phone}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-white/60">{contactInfo.address}</p>
        <p className="mt-1 text-xs text-white/60">{contactInfo.hours}</p>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="heading-serif text-xl text-navy">Need hotels or tours too?</h3>
        <p className="mt-2 text-sm text-text-muted">
          Many clients bundle flights with hotels, insurance, or tour packages. Ask when we send
          your quote — one invoice, one team.
        </p>
        <Link href="/tours" className="mt-5 inline-flex text-sm font-semibold text-brand-red hover:underline">
          Browse tour packages →
        </Link>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <Image
          src="/images/about/reception-detail.jpg"
          alt="Travel Zone reception"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 35vw"
        />
      </div>
    </div>
  );
}
