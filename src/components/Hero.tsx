"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { socialLinks } from "@/lib/social";

const slides = [
  {
    src: "/images/hero/office-consultation.jpg",
    alt: "TravelZone team consulting with a client in our East Legon office",
  },
  {
    src: "/images/hero/office-main.jpg",
    alt: "TravelZone office interior with branded glass partitions",
  },
  {
    src: "/images/hero/reception.jpg",
    alt: "TravelZone reception area in East Legon, Accra",
  },
  {
    src: "/images/hero/travel-wall.jpg",
    alt: "TravelZone branded travel consultation space",
  },
];

const INTERVAL_MS = 7000;

export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive((index + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section
      id="home"
      className="relative min-h-[88vh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0">
        {slides.map((item, index) => (
          <Image
            key={item.src}
            src={item.src}
            alt={item.alt}
            fill
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
            className={`object-cover object-center transition-opacity duration-700 ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
            sizes="100vw"
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/40" />

      <div className="relative flex min-h-[88vh] flex-col justify-end px-6 pt-28 pb-16 lg:pb-20">
        <div className="section-container w-full">
          <div className="max-w-2xl text-left">
            <p className="text-sm text-white/70">
              #2 Boundary Road · East Legon · Accra
            </p>
            <h1 className="heading-serif mt-4 text-[2.75rem] leading-[1.08] font-medium text-white sm:text-[3.25rem] lg:text-[4rem]">
              Experience Ghana with Travel Zone.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/80">
              Flights, hotels, tour packages, and group travel — booked from our
              office or over the phone. Walk in anytime during office hours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className="btn-primary">
                Book a trip
              </Link>
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/50 px-7 py-3 text-sm font-semibold text-white hover:border-white"
              >
                Book a consultation
              </Link>
              <Link href="/tours" className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-7 py-3 text-sm font-semibold text-white hover:border-white">
                View packages
              </Link>
            </div>
            <p className="mt-6 text-xs text-white/50">
              Also on{" "}
              <a
                href={socialLinks.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/70"
              >
                Instagram {socialLinks.instagram.handle}
              </a>
            </p>
          </div>

          <div className="mt-10 flex gap-2">
            {slides.map((item, index) => (
              <button
                key={item.src}
                type="button"
                aria-label={`Slide ${index + 1}`}
                aria-current={index === active}
                onClick={() => goTo(index)}
                className={`h-1 transition-all duration-300 ${
                  index === active
                    ? "w-8 bg-brand-red"
                    : "w-4 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
