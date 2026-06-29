import Image from "next/image";
import Link from "next/link";
import { services, contactInfo, teamStory } from "@/lib/content";
import type { AboutTeamMember } from "@/lib/about-team";

export function AboutHero() {
  return (
    <section className="relative flex min-h-[55vh] items-end overflow-hidden bg-navy pb-16 pt-32 lg:min-h-[60vh] lg:pb-20 lg:pt-40">
      <Image
        src="/images/hero/reception.jpg"
        alt="TravelZone reception at East Legon, Accra"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40" />

      <div className="relative section-container">
        <p className="text-sm font-semibold tracking-[0.2em] text-white/60 uppercase">
          About Us
        </p>
        <h1 className="heading-serif mt-3 max-w-3xl text-4xl leading-tight text-white lg:text-[3.25rem]">
          Two Decades of Exceptional Travel in Ghana
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/75">
          Discover, feel the culture, live the adventure — with a team that has
          been making it happen since day one.
        </p>
      </div>
    </section>
  );
}

export function AboutStats() {
  const stats = [
    { value: "2004", label: "Serving travelers since" },
    { value: "East Legon", label: "Our office location" },
    { value: "Groups", label: "Schools, churches, corporates" },
    { value: "Ghana + abroad", label: "Local tours & international" },
  ];

  return (
    <section className="border-b border-gray-100 bg-white py-12">
      <div className="section-container">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <p className="heading-serif text-2xl font-semibold text-brand-red lg:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutStory() {
  return (
    <section className="py-20 lg:py-28">
      <div className="section-container">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="heading-serif text-3xl text-navy lg:text-4xl">
              Who We Are
            </h2>
            <div className="mt-6 space-y-6 text-[16px] leading-[1.85] text-text-muted">
              <p>
                TravelZone is a trusted travel and destination management
                company with over 20 years of experience delivering exceptional
                travel solutions for individuals, groups, schools, and corporate
                organizations. We collaborate with major airlines, hotels, and
                tourism partners to provide seamless travel services,
                personalized itineraries, and professional on-ground support
                tailored to every client&apos;s needs.
              </p>
              <p>
                We specialize in curated tours to Ghana&apos;s most iconic
                destinations, including the Cape Coast Castles, Kakum Canopy
                Walkway, Mole National Park, Wli Waterfalls, and vibrant
                cultural festivals. From business travel and educational trips
                to family vacations and solo adventures, our team manages
                transportation, accommodation, logistics, and expert tour
                guidance to ensure safe, comfortable, and memorable experiences.
              </p>
              <p>
                At TravelZone, we are passionate about promoting sustainable
                tourism and showcasing the authentic beauty, culture, and
                heritage of Ghana. By working closely with local communities, we
                create meaningful travel experiences that connect visitors to the
                heart of the country while delivering world-class service with
                professionalism and excellence.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src="/images/about/waiting-area.jpg"
                alt="TravelZone client waiting area"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl pt-8">
              <Image
                src="/images/about/office-branding.jpg"
                alt="TravelZone branded office interior"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src="/images/hero/office-consultation.jpg"
                alt="TravelZone team assisting a client"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutTeam({ members }: { members: AboutTeamMember[] }) {
  return (
    <section className="border-t border-gray-100 bg-white py-20 lg:py-28">
      <div className="section-container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <div
              className="absolute -bottom-4 -left-4 hidden h-full w-full border-2 border-brand-red/30 lg:block"
              aria-hidden
            />
            <div className="relative aspect-[4/3] overflow-hidden bg-cream lg:aspect-[5/4]">
              <Image
                src={teamStory.groupImage}
                alt={teamStory.groupImageAlt}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium tracking-[0.14em] text-brand-red uppercase">
              Our team
            </p>
            <h2 className="heading-serif mt-2 text-3xl text-navy lg:text-4xl">
              Real people. Real travel expertise.
            </h2>
            <div className="mt-6 space-y-5 text-[15px] leading-[1.85] text-text-muted">
              {teamStory.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 lg:mt-24">
          <div className="flex flex-col gap-6 border-t border-gray-100 pt-12 sm:flex-row sm:items-end sm:justify-between lg:pt-14">
            <div className="max-w-xl">
              <p className="text-sm font-medium tracking-[0.14em] text-brand-red uppercase">
                Meet the team
              </p>
              <h3 className="heading-serif mt-2 text-2xl text-navy lg:text-3xl">
                The faces you&apos;ll meet in East Legon
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
                Walk into our office or call us — these are the consultants who
                plan your flights, packages, and group trips.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center justify-center border-2 border-navy px-7 py-3 text-sm font-semibold text-navy transition-colors hover:border-brand-red hover:text-brand-red"
            >
              Visit the office
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:gap-8">
            {members.map((member, index) => (
              <article
                key={`${member.name}-${index}`}
                className={`group flex flex-col overflow-hidden bg-cream ${
                  index === 0 ? "lg:-mt-4" : ""
                }`}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy via-navy/75 to-transparent px-5 pb-5 pt-20">
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50 uppercase">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h4 className="heading-serif mt-1 text-2xl text-white">
                      {member.name}
                    </h4>
                    <p className="mt-1 text-xs font-semibold tracking-wide text-brand-red uppercase">
                      {member.role}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col border border-t-0 border-gray-100 bg-white p-5 lg:p-6">
                  <p className="text-sm leading-relaxed text-text-muted">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutServices() {
  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="section-container">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="heading-serif text-3xl text-navy lg:text-4xl">
              Our Services
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
              Everything you need under one roof — from the moment you book to
              the moment you return home.
            </p>
            <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl lg:mt-10">
              <Image
                src="/images/about/brochure.jpg"
                alt="TravelZone services brochure"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.title}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red/10">
                  <span className="h-2 w-2 rounded-full bg-brand-red" />
                </div>
                <h3 className="font-semibold text-navy">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const destinations = [
  {
    name: "Cape Coast Castles",
    description:
      "Walk through history at UNESCO World Heritage sites along Ghana's coast.",
    image:
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80",
  },
  {
    name: "Kakum Canopy Walkway",
    description:
      "Experience the rainforest from above on one of Africa's longest canopy walks.",
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80",
  },
  {
    name: "Mole National Park",
    description:
      "Spot elephants, antelope, and over 300 bird species in Ghana's largest wildlife refuge.",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80",
  },
  {
    name: "Wli Waterfalls",
    description:
      "Hike to the highest waterfall in West Africa, nestled in the Volta Region.",
    image:
      "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80",
  },
];

export function AboutDestinations() {
  return (
    <section className="py-20 lg:py-28">
      <div className="section-container">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <h2 className="heading-serif text-3xl text-navy lg:text-4xl">
              Iconic Ghana Destinations
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
              Our curated itineraries take you to the landmarks, landscapes, and
              festivals that define Ghana&apos;s rich identity.
            </p>
          </div>
          <Link
            href="/tours"
            className="text-sm font-semibold text-brand-red hover:underline"
          >
            View Tour Packages →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((place) => (
            <article
              key={place.name}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={place.image}
                  alt={place.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 25vw"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-navy">{place.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {place.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const gallery = [
  {
    src: "/images/about/reception-wide.jpg",
    alt: "TravelZone reception with branded signage",
  },
  {
    src: "/images/about/reception-detail.jpg",
    alt: "TravelZone office display with model aircraft",
  },
  {
    src: "/images/hero/travel-wall.jpg",
    alt: "TravelZone travel consultation area",
  },
  {
    src: "/images/hero/office-glass.jpg",
    alt: "TravelZone glass-partitioned workspace",
  },
];

export function AboutGallery() {
  return (
    <section className="bg-navy py-20 lg:py-24">
      <div className="section-container">
        <div className="mb-10 max-w-xl">
          <h2 className="heading-serif text-3xl text-white lg:text-4xl">
            Visit Our Office
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/65">
            Stop by our East Legon office to plan your next trip in person. Our
            team is ready to help you discover Ghana and the world.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gallery.map((photo) => (
            <div
              key={photo.src}
              className="relative aspect-[4/5] overflow-hidden rounded-xl"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 25vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutCta() {
  return (
    <section className="py-20 lg:py-28">
      <div className="section-container">
        <div className="grid items-center gap-12 rounded-3xl bg-cream px-8 py-12 lg:grid-cols-2 lg:gap-16 lg:px-14 lg:py-16">
          <div>
            <h2 className="heading-serif text-3xl text-navy lg:text-4xl">
              Ready to Plan Your Journey?
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
              Whether it&apos;s a weekend getaway, a school excursion, or a
              corporate retreat — our team at TravelZone is here to make it
              happen.
            </p>
            <Link href="/contact" className="btn-primary mt-8">
              Get in Touch
            </Link>
          </div>

          <div className="space-y-5 text-[15px]">
            <div>
              <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                Address
              </p>
              <p className="mt-1 font-medium text-navy">{contactInfo.address}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                Phone
              </p>
              <div className="mt-1 space-y-1 font-medium text-navy">
                {contactInfo.phones.map((phone, i) => (
                  <a
                    key={phone}
                    href={`tel:${contactInfo.phoneHrefs[i]}`}
                    className="block hover:text-brand-red"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                Email
              </p>
              <a
                href={`mailto:${contactInfo.email}`}
                className="mt-1 block font-medium text-navy hover:text-brand-red"
              >
                {contactInfo.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutSustainability() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-24">
      <Image
        src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80"
        alt="Ghana rainforest"
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-navy/85" />

      <div className="relative section-container text-center">
        <h2 className="heading-serif text-3xl text-white lg:text-4xl">
          Sustainable Tourism, Authentic Experiences
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-[1.75] text-white/75">
          We believe travel should benefit the communities that make each
          destination special. By partnering with local guides, artisans, and
          hospitality providers across Ghana, TravelZone creates journeys that
          are responsible, enriching, and true to the spirit of the country.
        </p>
      </div>
    </section>
  );
}
