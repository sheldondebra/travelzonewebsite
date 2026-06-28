"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useActionState } from "react";
import {
  deleteTourFormAction,
  updateTourStatusAction,
  type TourActionResult,
} from "@/app/admin/actions/tours";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminTour } from "@/lib/content-types";
import type { StaffRole } from "@/lib/supabase/auth";
import { formatPrice } from "@/lib/tours";

type Filter = "all" | "published" | "draft";

type Props = {
  tours: AdminTour[];
  role: StaffRole;
};

function ActionMessage({ result }: { result: TourActionResult | undefined }) {
  if (!result) return null;
  return (
    <AdminNotice variant={result.success ? "success" : "error"}>
      {result.success ? result.message : result.error}
    </AdminNotice>
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
      <div className="admin-users-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tours"
          className="admin-input w-full sm:max-w-xs"
          aria-label="Search tours"
        />
      </div>

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

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th className="w-14" aria-label="Image" />
              <th>Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#646970]">
                  {tours.length === 0 ? (
                    <div className="space-y-3">
                      <p>No tours yet.</p>
                      <Link href="/admin/tours/new" className="admin-button-primary">
                        Add your first tour
                      </Link>
                    </div>
                  ) : (
                    "No tours match your search."
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((tour) => (
                <TourRow key={tour.id} tour={tour} role={role} />
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
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

  const nextStatus = tour.status === "published" ? "draft" : "published";
  const statusLabel =
    tour.status === "published" ? "Switch to Draft" : "Publish";

  return (
    <tr>
      <td>
        <Link
          href={`/admin/tours/${tour.id}/edit`}
          className="admin-tour-thumb"
          aria-label={`Edit ${tour.title}`}
        >
          {tour.image ? (
            <Image
              src={tour.image}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 object-cover"
            />
          ) : (
            <span className="admin-tour-thumb-empty">{tour.title.charAt(0)}</span>
          )}
        </Link>
      </td>
      <td>
        <Link href={`/admin/tours/${tour.id}/edit`} className="admin-row-title">
          {tour.title}
        </Link>
        {tour.tagline ? (
          <p className="mt-0.5 line-clamp-1 text-[12px] text-[#646970]">
            {tour.tagline}
          </p>
        ) : null}
        <div className="admin-row-actions">
          <Link href={`/admin/tours/${tour.id}/edit`}>Edit</Link>
          {tour.status === "published" ? (
            <>
              <span>|</span>
              <Link href={`/tours/${tour.slug}`} target="_blank">
                View
              </Link>
            </>
          ) : null}
          <span>|</span>
          <form action={statusAction} className="inline">
            <input type="hidden" name="id" value={tour.id} />
            <input type="hidden" name="status" value={nextStatus} />
            <button
              type="submit"
              disabled={statusPending}
              className="admin-row-action-link"
            >
              {statusPending ? "Updating…" : statusLabel}
            </button>
          </form>
          {role === "admin" ? (
            <>
              <span>|</span>
              <form
                action={deleteAction}
                className="inline"
                onSubmit={(event) => {
                  if (
                    !confirm(
                      `Delete "${tour.title}"? This cannot be undone.`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={tour.id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  className="admin-row-action-delete inline"
                >
                  {deletePending ? "Deleting…" : "Delete"}
                </button>
              </form>
            </>
          ) : null}
        </div>
        {statusState ? <ActionMessage result={statusState} /> : null}
        {deleteState ? <ActionMessage result={deleteState} /> : null}
      </td>
      <td className="text-[#646970]">{tour.category || "—"}</td>
      <td>{formatPrice(tour.price, tour.currency)}</td>
      <td>
        <StatusBadge status={tour.status} />
      </td>
      <td className="text-[#646970]">
        {new Date(tour.updatedAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
    </tr>
  );
}
