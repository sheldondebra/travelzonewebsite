import Image from "next/image";
import Link from "next/link";
import { PhoneIcon } from "@/components/ContactIcons";
import { contactInfo } from "@/lib/content";

export function OfficeCta() {
  return (
    <section className="relative overflow-hidden bg-navy py-24 lg:py-32">
      <Image
        src="/images/about/waiting-area.jpg"
        alt="TravelZone office waiting area"
        fill
        className="object-cover opacity-25"
        sizes="100vw"
      />

      <div className="relative section-container">
        <div className="max-w-2xl">
          <p className="text-sm text-white/60">#2 Boundary Road, East Legon</p>
          <h2 className="heading-serif mt-3 text-3xl leading-tight text-white lg:text-4xl">
            Walk in, call, or send a message. Real people at a real desk.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-white/75">
            {contactInfo.hours}. Stop by to pick up brochures, ask about flight
            fares, or plan a group trip over a cup of coffee.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/consultation" className="btn-primary">
              Book a consultation
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full border-2 border-white/40 px-7 py-3 text-sm font-semibold text-white hover:border-white">
              Contact us
            </Link>
            <a
              href={`tel:${contactInfo.phoneHrefs[0]}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 px-7 py-3 text-sm font-semibold text-white hover:border-white"
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
