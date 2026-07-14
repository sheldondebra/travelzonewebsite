import Image from "next/image";
import Link from "next/link";
import type { Tour } from "@/lib/tours";
import { formatTourPrice } from "@/lib/tours";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <article className="flex flex-col overflow-hidden border border-gray-100 bg-white">
      <Link href={`/tours/${tour.slug}`} className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {tour.travelPeriod && (
          <span className="absolute top-3 left-3 bg-brand-red px-3 py-1 text-[11px] font-semibold text-white uppercase">
            {tour.travelPeriod}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
          {tour.duration} · {tour.location}
        </p>
        <Link href={`/tours/${tour.slug}`}>
          <h3 className="heading-serif mt-1.5 text-xl text-navy hover:text-brand-red">
            {tour.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
          {tour.tagline}
        </p>
        <p className="mt-4 text-sm font-medium text-brand-red">
          From {formatTourPrice(tour)}
        </p>

        <div className="mt-auto flex gap-3 pt-5">
          <Link
            href={`/tours/${tour.slug}`}
            className="flex-1 border-2 border-navy py-2.5 text-center text-sm font-semibold text-navy hover:bg-navy hover:text-white"
          >
            View details
          </Link>
          <Link
            href={`/book?tour=${tour.slug}`}
            className="flex-1 bg-brand-red py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-red-hover"
          >
            Book now
          </Link>
        </div>
      </div>
    </article>
  );
}
