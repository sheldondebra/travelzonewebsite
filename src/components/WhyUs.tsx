import Image from "next/image";
import Link from "next/link";

const reasons = [
  {
    number: "01",
    title: "We've done this for 20 years",
    description:
      "Same office, same team, same partners. When something goes wrong on a trip, we know who to call.",
  },
  {
    number: "02",
    title: "One place for everything",
    description:
      "Flight, hotel, bus, guide, insurance — you don't need to coordinate five different vendors.",
  },
  {
    number: "03",
    title: "Groups are our specialty",
    description:
      "School excursions, church outings, corporate retreats. We move 10 to 500 people regularly.",
  },
  {
    number: "04",
    title: "Ghana first",
    description:
      "Cape Coast, Kakum, Mole, festivals, Volta — we know these routes because we run them every month.",
  },
];

export function WhyUs() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="relative flex flex-col justify-center bg-navy px-6 py-16 lg:px-12 lg:py-24 xl:px-16">
          <div className="absolute inset-y-0 right-0 hidden w-px bg-white/10 lg:block" aria-hidden />
          <p className="text-sm font-medium tracking-[0.16em] text-brand-red uppercase">
            Why Travel Zone
          </p>
          <h2 className="heading-serif mt-3 max-w-md text-3xl leading-tight text-white lg:text-4xl">
            Why people keep coming back to our desk
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
            Real consultants, one East Legon office, and two decades of trips
            booked the right way — not just the cheapest fare online.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/consultation" className="btn-primary">
              Book a consultation
            </Link>
            <Link href="/about" className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white">
              About us
            </Link>
            <Link
              href="/what-we-do"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
            >
              Our services
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 lg:max-w-md">
            <div>
              <dt className="text-xs tracking-wide text-white/50 uppercase">Since</dt>
              <dd className="heading-serif mt-1 text-2xl text-white">2004</dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-white/50 uppercase">Groups</dt>
              <dd className="heading-serif mt-1 text-2xl text-white">10–500+</dd>
            </div>
          </dl>
        </div>

        <div className="relative min-h-[28rem] lg:min-h-full">
          <Image
            src="/images/hero/travel-wall.jpg"
            alt="Travel Zone consultation space in East Legon"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/35 to-navy/10 lg:bg-gradient-to-r lg:from-navy/80 lg:via-navy/25 lg:to-transparent"
            aria-hidden
          />

          <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 lg:p-10 lg:pt-24">
            <ul className="grid gap-4 sm:grid-cols-2">
              {reasons.map((item) => (
                <li
                  key={item.number}
                  className="border border-white/10 bg-white/95 p-5 shadow-sm backdrop-blur-sm"
                >
                  <p className="heading-serif text-2xl text-brand-red">{item.number}</p>
                  <h3 className="mt-2 text-base font-semibold text-navy">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {item.description}
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
