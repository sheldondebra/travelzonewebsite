"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useActionState } from "react";
import {
  deleteTourFormAction,
  updateTourStatusAction,
} from "@/app/admin/actions/tours";
import {
  useAdminActionFeedback,
} from "@/components/admin/AdminToastProvider";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminTour } from "@/lib/content-types";
import type { StaffRole } from "@/lib/supabase/auth";
import { formatPrice } from "@/lib/tours";

type Filter = "all" | "published" | "draft";

type Props = {
  tours: AdminTour[];
  role: StaffRole;
};

function TourThumbnail({ tour }: { tour: AdminTour }) {
  if (!tour.image) {
    return (
      <span className="admin-tour-thumb-empty" aria-hidden>
        {tour.title.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={tour.image}
      alt=""
      width={48}
      height={48}
      className="h-12 w-12 object-cover"
      unoptimized={!tour.image.includes("supabase.co") && !tour.image.includes("unsplash.com")}
    />
  );
}

function TourRow({ tour, role }: { tour: AdminTour; role: StaffRole }) {
  const [statusState, statusAction, statusPending] = useActionState(
    updateTourStatusAction,
    undefined,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTourFormAction,
    undefined,
  );

  useAdminActionFeedback(statusState, statusPending, {
    loadingMessage: "Updating tour…",
  });
  useAdminActionFeedback(deleteState, deletePending, {
    loadingMessage: "Deleting tour…",
  });

  const nextStatus = tour.status === "published" ? "draft" : "published";
  const statusLabel = tour.status === "published" ? "Unpublish" : "Publish";

  return (
    <tr>
      <td className="w-14">
        <Link
          href={`/admin/tours/${tour.id}/edit`}
          className="admin-tour-thumb"
          aria-label={`Edit ${tour.title}`}
        >
          <TourThumbnail tour={tour} />
        </Link>
      </td>
      <td className="min-w-[220px]">
        <Link href={`/admin/tours/${tour.id}/edit`} className="admin-row-title">
          {tour.title}
        </Link>
        {tour.tagline ? (
          <p className="mt-0.5 line-clamp-1 text-[12px] text-[#646970]">{tour.tagline}</p>
        ) : null}
        {tour.location ? (
          <p className="mt-0.5 text-[11px] text-[#787c82]">{tour.location}</p>
        ) : null}
      </td>
      <td className="hidden text-[#646970] md:table-cell">{tour.category || "—"}</td>
      <td className="whitespace-nowrap">{formatPrice(tour.price, tour.currency)}</td>
      <td>
        <StatusBadge status={tour.status} />
      </td>
      <td className="hidden text-[#646970] lg:table-cell">
        {new Date(tour.updatedAt).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="min-w-[180px]">
        <div className="admin-row-actions flex flex-wrap items-center gap-x-1 gap-y-1">
          <Link href={`/admin/tours/${tour.id}/edit`}>Edit</Link>
          {tour.status === "published" ? (
            <>
              <span aria-hidden>|</span>
              <Link href={`/tours/${tour.slug}`} target="_blank">
                View
              </Link>
            </>
          ) : null}
          <span aria-hidden>|</span>
          <form action={statusAction} className="inline">
            <input type="hidden" name="id" value={tour.id} />
            <input type="hidden" name="status" value={nextStatus} />
            <button
              type="submit"
              disabled={statusPending || deletePending}
              className="admin-row-action-link"
            >
              {statusPending ? "Saving…" : statusLabel}
            </button>
          </form>
          {role === "admin" ? (
            <>
              <span aria-hidden>|</span>
              <form
                action={deleteAction}
                className="inline"
                onSubmit={(event) => {
                  if (!confirm(`Delete "${tour.title}"? This cannot be undone.`)) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={tour.id} />
                <button
                  type="submit"
                  disabled={statusPending || deletePending}
                  className="admin-row-action-delete inline"
                >
                  {deletePending ? "Deleting…" : "Delete"}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function ToursList({ tours, role }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const published = tours.filter((tour) => tour.status === "published").length;
  const drafts = tours.filter((tour) => tour.status === "draft").length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tours.filter((tour) => {
      if (filter === "published" && tour.status !== "published") return false;
      if (filter === "draft" && tour.status !== "draft") return false;
      if (!query) return true;
      return (
        tour.title.toLowerCase().includes(query) ||
        tour.slug.toLowerCase().includes(query) ||
        tour.category.toLowerCase().includes(query) ||
        tour.location.toLowerCase().includes(query)
      );
    });
  }, [filter, search, tours]);

  return (
    <>
      <div className="admin-tours-stats">
        <div className="admin-tours-stat">
          <span className="admin-tours-stat-value">{tours.length}</span>
          <span className="admin-tours-stat-label">Total tours</span>
        </div>
        <div className="admin-tours-stat">
          <span className="admin-tours-stat-value">{published}</span>
          <span className="admin-tours-stat-label">Published</span>
        </div>
        <div className="admin-tours-stat">
          <span className="admin-tours-stat-value">{drafts}</span>
          <span className="admin-tours-stat-label">Drafts</span>
        </div>
      </div>

      <div className="admin-tours-toolbar">
        <ul className="admin-subsubsub">
          <li>
            <button
              type="button"
              className={filter === "all" ? "current" : ""}
              onClick={() => setFilter("all")}
            >
              All ({tours.length})
            </button>
          </li>
          <li>
            <button
              type="button"
              className={filter === "published" ? "current" : ""}
              onClick={() => setFilter("published")}
            >
              Published ({published})
            </button>
          </li>
          <li>
            <button
              type="button"
              className={filter === "draft" ? "current" : ""}
              onClick={() => setFilter("draft")}
            >
              Draft ({drafts})
            </button>
          </li>
        </ul>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, slug, category…"
          className="admin-input w-full sm:max-w-xs"
          aria-label="Search tours"
        />
      </div>

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
          <table className="admin-list-table admin-tours-table">
            <thead>
              <tr>
                <th className="w-14" aria-label="Image" />
                <th>Title</th>
                <th className="hidden md:table-cell">Category</th>
                <th>Price</th>
                <th>Status</th>
                <th className="hidden lg:table-cell">Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#646970]">
                    {tours.length === 0 ? (
                      <div className="space-y-3">
                        <p>No tours yet. Create your first package to show on the site.</p>
                        <Link href="/admin/tours/new" className="admin-button-primary">
                          Add your first tour
                        </Link>
                      </div>
                    ) : (
                      "No tours match your search or filter."
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((tour) => <TourRow key={tour.id} tour={tour} role={role} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
