import Link from "next/link";
import { TourCard } from "@/components/tours/TourCard";
import { getPublishedTours } from "@/lib/tours";

export async function PopularTours() {
  const tours = await getPublishedTours();

  return (
    <section id="tours" className="bg-cream py-20 lg:py-28">
      <div className="section-container">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-red">Tour package</p>
            <h2 className="heading-serif mt-1 text-3xl text-navy">
              Dubai Summer Getaway
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              4 nights / 5 days · June – August · from USD 1,500 pp
            </p>
          </div>
          <Link
            href="/tours"
            className="text-sm font-semibold text-navy hover:text-brand-red"
          >
            Full details →
          </Link>
        </div>

        <div className="grid gap-6 lg:max-w-md">
          {tours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  );
}
