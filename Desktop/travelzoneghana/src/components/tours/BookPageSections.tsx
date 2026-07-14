import Image from "next/image";
import Link from "next/link";
import { PhoneIcon } from "@/components/ContactIcons";
import { contactInfo } from "@/lib/content";

const steps = [
  {
    step: "01",
    title: "Choose a package",
    detail: "Pick the trip that fits your dates and budget.",
  },
  {
    step: "02",
    title: "Enter your details",
    detail: "Name, contact, travel date, and number of travelers.",
  },
  {
    step: "03",
    title: "Pay securely",
    detail: "Mobile money or card via Paystack. SMS confirmation after.",
  },
];

export function BookHero() {
  return (
    <section className="relative min-h-[58vh] overflow-hidden bg-navy lg:min-h-[62vh]">
      <Image
        src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
        alt="Dubai skyline at dusk"
        fill
        priority
        className="object-cover opacity-45"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/88 to-navy/55" />

      <div className="relative flex min-h-[58vh] flex-col justify-end pb-14 pt-32 lg:min-h-[62vh] lg:pb-20 lg:pt-40">
        <div className="section-container">
          <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-[0.16em] text-brand-red uppercase">
                Book online
              </p>
              <h1 className="heading-serif mt-3 text-[2.35rem] leading-[1.08] text-white sm:text-5xl lg:text-[3.25rem]">
                Reserve your trip in minutes
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/75">
                Select a package, fill in your details, and pay with MTN MoMo,
                Telecel Cash, or card. Our team confirms by SMS once payment
                goes through.
              </p>
              <a
                href={`tel:${contactInfo.phoneHrefs[0]}`}
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
              >
                <PhoneIcon className="h-4 w-4" />
                Prefer to book by phone? {contactInfo.phones[0]}
              </a>
            </div>

            <div className="hidden border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:block lg:p-7">
              <p className="text-xs font-medium tracking-wide text-white/50 uppercase">
                How it works
              </p>
              <ol className="mt-4 space-y-4">
                {steps.map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <span className="heading-serif text-lg font-semibold text-brand-red">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/55">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BookStepsStrip() {
  return (
    <section className="border-b border-gray-100 bg-white py-10 lg:hidden">
      <div className="section-container">
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="border-l-2 border-brand-red pl-4">
              <p className="text-xs font-bold tracking-widest text-brand-red/80">
                {item.step}
              </p>
              <p className="mt-1 text-sm font-semibold text-navy">{item.title}</p>
              <p className="mt-1 text-xs text-text-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BookAssurance() {
  return (
    <section className="border-t border-gray-100 bg-cream py-16 lg:py-20">
      <div className="section-container">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="border border-gray-200/80 bg-white p-6">
            <p className="text-xs font-medium tracking-wide text-brand-red uppercase">
              Secure payment
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Checkout runs through Paystack. We never store your card or mobile
              money PIN on our servers.
            </p>
          </div>
          <div className="border border-gray-200/80 bg-white p-6">
            <p className="text-xs font-medium tracking-wide text-brand-red uppercase">
              SMS confirmation
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Once payment succeeds, you receive a text with your booking
              reference. Our team follows up if anything else is needed.
            </p>
          </div>
          <div className="border border-gray-200/80 bg-white p-6">
            <p className="text-xs font-medium tracking-wide text-brand-red uppercase">
              East Legon office
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {contactInfo.address}. {contactInfo.hours}. Walk in anytime to
              ask questions before you pay online.
            </p>
            <Link
              href="/contact"
              className="mt-3 inline-block text-sm font-semibold text-navy hover:text-brand-red"
            >
              Contact us →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
