import Image from "next/image";
import Link from "next/link";
import { ClockIcon, MapPinIcon } from "@/components/ContactIcons";
import { contactInfo } from "@/lib/content";

const highlights = [
  {
    label: "Office",
    value: "East Legon",
    detail: contactInfo.address,
    icon: MapPinIcon,
  },
  {
    label: "Experience",
    value: "20+ years",
    detail: "In travel since 2004",
    icon: ClockIcon,
  },
  {
    label: "We serve",
    value: "10–500+",
    detail: "Families, schools, groups & corporates",
    icon: UsersIcon,
  },
  {
    label: "Core work",
    value: "One desk",
    detail: "Ticketing, hotels, tours & insurance",
    icon: ServicesIcon,
  },
] as const;

function UsersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 20a4 4 0 0 1 8 0H3Zm9 0h5a3.5 3.5 0 0 0-7 0h2Z" />
    </svg>
  );
}

function ServicesIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 3h3v4h-3v-4Zm4 0h3v4h-3v-4Z" />
    </svg>
  );
}

export function StatsAbout() {
  return (
    <section className="py-20 lg:py-28">
      <div className="section-container">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium text-brand-red">Since 2004</p>
            <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
              Travel Zone
            </h2>
            <p className="mt-5 text-[16px] leading-[1.8] text-text-muted">
              We&apos;re a travel and destination management company on Boundary
              Road in East Legon. For over 20 years we&apos;ve been booking
              flights, reserving hotels, and putting together tours for
              individuals, schools, churches, and companies across Ghana.
            </p>
            <p className="mt-4 text-[16px] leading-[1.8] text-text-muted">
              Cape Coast, Kakum, Mole, Wli — we run these trips regularly and
              know the routes, the guides, and the lodges. International
              travel too, when you need it.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl bg-navy">
              <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                <p className="text-xs font-semibold tracking-[0.18em] text-brand-red uppercase">
                  At a glance
                </p>
                <p className="mt-1 text-sm text-white/70">
                  The essentials about our desk in East Legon.
                </p>
              </div>

              <div className="grid sm:grid-cols-2">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  const bordered =
                    index % 2 === 0 ? "sm:border-r sm:border-white/10" : "";
                  const bottomBorder =
                    index < 2 ? "border-b border-white/10 sm:border-b" : "";

                  return (
                    <article
                      key={item.label}
                      className={`flex gap-4 px-5 py-5 sm:px-6 sm:py-6 ${bordered} ${bottomBorder}`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-red">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-white/50 uppercase">
                          {item.label}
                        </p>
                        <p className="heading-serif mt-1 text-2xl leading-tight text-white">
                          {item.value}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-white/65">
                          {item.detail}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className="btn-primary">
                About us
              </Link>
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-7 py-3 text-sm font-semibold text-navy transition-colors hover:border-brand-red hover:text-brand-red"
              >
                Book a consultation
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl lg:aspect-auto lg:h-[540px]">
            <Image
              src="/images/hero/office-consultation.jpg"
              alt="TravelZone staff helping a client plan a trip"
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
