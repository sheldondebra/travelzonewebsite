import Link from "next/link";
import { PhoneIcon } from "@/components/ContactIcons";
import { contactInfo } from "@/lib/content";

export function BlogPostCta() {
  return (
    <section className="py-16 lg:py-20">
      <div className="section-container">
        <div className="grid items-center gap-10 rounded-3xl bg-navy px-8 py-12 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-14 lg:py-16">
          <div>
            <p className="text-sm font-medium tracking-[0.14em] text-brand-red uppercase">
              Plan your trip
            </p>
            <h2 className="heading-serif mt-3 text-3xl text-white lg:text-4xl">
              Ready to experience it for yourself?
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">
              Travel Zone organizes Ghana tours with transport, licensed guides,
              and logistics handled — from day trips out of Accra to multi-day
              safaris and school excursions.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/book" className="btn-primary text-center">
              Book a trip
            </Link>
            <Link
              href="/consultation"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/40 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
            >
              Book a consultation
            </Link>
            <a
              href={`tel:${contactInfo.phoneHrefs[0]}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
            >
              <PhoneIcon className="h-4 w-4" />
              {contactInfo.phones[0]}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
