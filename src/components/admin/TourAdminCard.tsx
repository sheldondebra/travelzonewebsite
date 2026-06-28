import Image from "next/image";
import Link from "next/link";
import { DeleteTourButton } from "@/components/admin/DeleteTourButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminTour } from "@/lib/content-types";
import type { StaffRole } from "@/lib/supabase/auth";
import { formatPrice } from "@/lib/tours";

type Props = {
  tour: AdminTour;
  role: StaffRole;
};

export function TourAdminCard({ tour, role }: Props) {
  const updated = new Date(tour.updatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-parchment bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-cream">
        {tour.image ? (
          <Image
            src={tour.image}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy/5 to-brand-red/10">
            <span className="heading-serif text-4xl text-navy/20">
              {tour.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute right-3 top-3">
          <StatusBadge status={tour.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {tour.category ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">
            {tour.category}
          </p>
        ) : null}

        <h2 className="heading-serif mt-1 text-lg leading-snug text-navy">{tour.title}</h2>

        {tour.tagline ? (
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">{tour.tagline}</p>
        ) : null}

        <dl className="mt-4 space-y-1.5 text-sm text-text-muted">
          {tour.location ? (
            <div className="flex gap-2">
              <dt className="sr-only">Location</dt>
              <dd>{tour.location}</dd>
            </div>
          ) : null}
          {tour.duration ? (
            <div className="flex gap-2">
              <dt className="sr-only">Duration</dt>
              <dd>{tour.duration}</dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-4 text-sm font-semibold text-navy">
          {formatPrice(tour.price, tour.currency)}
          {tour.priceNote ? (
            <span className="font-normal text-text-muted"> · {tour.priceNote}</span>
          ) : null}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-parchment pt-4">
          <p className="text-xs text-text-muted">Updated {updated}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/tours/${tour.id}/edit`}
              className="inline-flex items-center rounded-full bg-navy px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy/90"
            >
              Edit
            </Link>
            {tour.status === "published" ? (
              <Link
                href={`/tours/${tour.slug}`}
                target="_blank"
                className="inline-flex items-center rounded-full border border-parchment px-3.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-red hover:text-brand-red"
              >
                View live
              </Link>
            ) : null}
            {role === "admin" ? (
              <DeleteTourButton id={tour.id} title={tour.title} />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
