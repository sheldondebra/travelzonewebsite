import Image from "next/image";
import Link from "next/link";
import { contactInfo } from "@/lib/content";

const notes = [
  {
    quote:
      "We use Travel Zone for our school trips every year. They handle the buses, the hotels, and the guides — we just bring the students.",
    name: "Mrs. Adjei",
    context: "Secondary school administrator, Accra",
  },
  {
    quote:
      "I needed tickets to Dubai and a hotel near the airport. One phone call, done the same afternoon. That is why I do not shop around anymore.",
    name: "Kofi Mensah",
    context: "Regular client, East Legon",
  },
  {
    quote:
      "Our church group of 45 went to Cape Coast and Kakum. Everything was on time, the food was arranged, and nobody got left behind.",
    name: "Pastor Daniel Owusu",
    context: "Group trip organizer",
  },
];

export function Testimonials() {
  return (
    <section className="border-y border-gray-100 bg-parchment py-20 lg:py-24">
      <div className="section-container">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden lg:aspect-auto lg:min-h-[420px]">
            <Image
              src="/images/about/reception-detail.jpg"
              alt="TravelZone office"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-brand-red">
              From our clients
            </p>
            <h2 className="heading-serif mt-2 text-2xl text-navy lg:text-3xl">
              Word of mouth is how most people find us.
            </h2>

            <ul className="mt-10 space-y-8">
              {notes.map((item) => (
                <li key={item.name} className="border-l-2 border-brand-red pl-5">
                  <blockquote className="text-[15px] leading-relaxed text-text-muted">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  <p className="mt-3 text-sm font-semibold text-navy">
                    {item.name}
                  </p>
                  <p className="text-xs text-text-muted">{item.context}</p>
                </li>
              ))}
            </ul>

            <Link
              href="/contact"
              className="mt-10 inline-block text-sm font-semibold text-brand-red hover:underline"
            >
              Plan your trip →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
