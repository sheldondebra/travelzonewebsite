"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BookTourForm } from "@/components/tours/BookTourForm";
import type { Tour } from "@/lib/tours";
import { formatTourPrice } from "@/lib/tours";

type BookTripFlowProps = {
  tours: Tour[];
  initialSlug?: string;
  paymentsReady?: boolean;
};

export function BookTripFlow({
  tours,
  initialSlug,
  paymentsReady = false,
}: BookTripFlowProps) {
  const defaultSlug = initialSlug ?? tours[0]?.slug ?? "";
  const [selectedSlug, setSelectedSlug] = useState(defaultSlug);
  const selectedTour = tours.find((tour) => tour.slug === selectedSlug);

  if (tours.length === 0) {
    return (
      <div className="border border-gray-100 bg-white px-8 py-14 text-center">
        <p className="heading-serif text-2xl text-navy">No packages available</p>
        <p className="mt-2 text-sm text-text-muted">
          Check back soon or call us to plan a custom trip.
        </p>
        <Link href="/contact" className="btn-primary mt-8 inline-flex">
          Contact us
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-12 xl:grid-cols-[1fr_440px] xl:gap-16">
      <div>
        <div className="flex items-end justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <p className="text-sm font-medium text-brand-red">Step 1</p>
            <h2 className="heading-serif mt-1 text-2xl text-navy lg:text-3xl">
              Choose your package
            </h2>
          </div>
          <p className="hidden text-sm text-text-muted sm:block">
            {tours.length} {tours.length === 1 ? "package" : "packages"} available
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {tours.map((tour) => {
            const isSelected = tour.slug === selectedSlug;

            return (
              <button
                key={tour.slug}
                type="button"
                onClick={() => setSelectedSlug(tour.slug)}
                aria-pressed={isSelected}
                className={`group flex flex-col overflow-hidden border text-left transition-all ${
                  isSelected
                    ? "border-brand-red shadow-[0_0_0_1px_var(--color-brand-red)]"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={tour.image}
                    alt={tour.title}
                    fill
                    className={`object-cover transition-transform duration-500 ${
                      isSelected ? "scale-105" : "group-hover:scale-[1.02]"
                    }`}
                    sizes="(max-width: 640px) 100vw, 40vw"
                  />
                  {tour.travelPeriod && (
                    <span className="absolute top-3 left-3 bg-brand-red px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
                      {tour.travelPeriod}
                    </span>
                  )}
                  <span
                    className={`absolute top-3 right-3 flex h-6 w-6 items-center justify-center border-2 ${
                      isSelected
                        ? "border-brand-red bg-brand-red text-white"
                        : "border-white/80 bg-navy/40 text-transparent"
                    }`}
                    aria-hidden
                  >
                    ✓
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
                    {tour.duration} · {tour.location.split(",")[0]}
                  </p>
                  <h3 className="heading-serif mt-1.5 text-xl text-navy">
                    {tour.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                    {tour.tagline}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-brand-red">
                    From {formatTourPrice(tour)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedTour && (
          <div className="mt-8 border border-gray-100 bg-cream p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                  Selected package
                </p>
                <p className="mt-1 font-semibold text-navy">{selectedTour.title}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {selectedTour.highlights.length} experiences ·{" "}
                  {selectedTour.included.length} inclusions
                </p>
              </div>
              <Link
                href={`/tours/${selectedTour.slug}`}
                className="text-sm font-semibold text-navy hover:text-brand-red"
              >
                Full itinerary →
              </Link>
            </div>

            <ul className="mt-4 flex flex-wrap gap-2">
              {selectedTour.highlights.slice(0, 4).map((item) => (
                <li
                  key={item}
                  className="border border-gray-200/80 bg-white px-2.5 py-1 text-xs text-navy"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="xl:sticky xl:top-28 xl:self-start">
        <div className="mb-4 hidden border-b border-gray-100 pb-4 xl:block">
          <p className="text-sm font-medium text-brand-red">Steps 2 & 3</p>
          <h2 className="heading-serif mt-1 text-xl text-navy">Details & payment</h2>
        </div>

        {selectedTour ? (
          <BookTourForm
            key={selectedTour.slug}
            tour={selectedTour}
            paymentsReady={paymentsReady}
            variant="checkout"
          />
        ) : (
          <div className="border border-gray-100 bg-cream px-6 py-12 text-center">
            <p className="text-sm text-text-muted">
              Select a package on the left to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
