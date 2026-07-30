"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/hero-slides";
import { socialLinks } from "@/lib/social";

const INTERVAL_MS = 7000;

type Props = {
  slides: HeroSlide[];
};

export function Hero({ slides }: Props) {
  const safeSlides = slides.length > 0 ? slides : [];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (safeSlides.length === 0) return;
      setActive((index + safeSlides.length) % safeSlides.length);
    },
    [safeSlides.length],
  );

  useEffect(() => {
    if (paused || safeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % safeSlides.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, safeSlides.length]);

  if (safeSlides.length === 0) return null;

  const activeIndex = active % safeSlides.length;
  const current = safeSlides[activeIndex] ?? safeSlides[0];

  return (
    <section
      id="home"
      className="relative min-h-[88vh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0">
        {safeSlides.map((item, index) => (
          <Image
            key={`${item.imageUrl}-${index}`}
            src={item.imageUrl}
            alt={item.imageAlt || item.headline}
            fill
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
            className={`object-cover object-center transition-opacity duration-700 ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            sizes="100vw"
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/40" />

      <div className="relative flex min-h-[88vh] flex-col justify-end px-6 pt-28 pb-16 lg:pb-20">
        <div className="section-container w-full">
          <div className="max-w-2xl text-left">
            {current.eyebrow ? (
              <p className="text-sm text-white/70">{current.eyebrow}</p>
            ) : null}
            <h1 className="heading-serif mt-4 text-[2.75rem] leading-[1.08] font-medium text-white sm:text-[3.25rem] lg:text-[4rem]">
              {current.headline}
            </h1>
            {current.body ? (
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/80">
                {current.body}
              </p>
            ) : null}
            {current.ctas.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {current.ctas.map((cta) =>
                  cta.style === "primary" ? (
                    <Link key={`${cta.href}-${cta.label}`} href={cta.href} className="btn-primary">
                      {cta.label}
                    </Link>
                  ) : (
                    <Link
                      key={`${cta.href}-${cta.label}`}
                      href={cta.href}
                      className="inline-flex items-center justify-center rounded-full border-2 border-white/50 px-7 py-3 text-sm font-semibold text-white hover:border-white"
                    >
                      {cta.label}
                    </Link>
                  ),
                )}
              </div>
            ) : null}
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

          {safeSlides.length > 1 ? (
            <div className="mt-10 flex gap-2">
              {safeSlides.map((item, index) => (
                <button
                  key={`${item.imageUrl}-dot-${index}`}
                  type="button"
                  aria-label={`Slide ${index + 1}`}
                  aria-current={index === activeIndex}
                  onClick={() => goTo(index)}
                  className={`h-1 transition-all duration-300 ${
                    index === activeIndex
                      ? "w-8 bg-brand-red"
                      : "w-4 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
