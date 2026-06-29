import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { AdminSavedQueryToast } from "@/components/admin/AdminSavedQueryToast";
import { DeleteTourButton } from "@/components/admin/DeleteTourButton";
import { TourForm } from "@/components/admin/TourForm";
import { getAdminTour } from "@/lib/content-admin";
import { requireStaff } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditTourPage({ params, searchParams }: Props) {
  const { role } = await requireStaff();
  const { id } = await params;
  await searchParams;
  const tour = await getAdminTour(id);
  if (!tour) notFound();

  return (
    <>
      <AdminSavedQueryToast message="Tour updated." />
      <AdminPageHeader
        title="Edit Tour"
        description={tour.title}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {tour.status === "published" ? (
              <Link
                href={`/tours/${tour.slug}`}
                target="_blank"
                className="admin-button-secondary"
              >
                View tour
              </Link>
            ) : null}
            <Link href="/admin/tours" className="admin-button-secondary">
              Back to Tours
            </Link>
          </div>
        }
      />

      <TourForm tour={tour} />

      {role === "admin" ? (
        <div className="admin-postbox mt-5">
          <div className="admin-postbox-header">
            <h2>Delete tour</h2>
          </div>
          <div className="admin-postbox-body">
            <p className="m-0 text-[13px] text-[#646970]">
              Permanently remove this tour from the site. This action cannot be
              undone.
            </p>
            <div className="mt-3">
              <DeleteTourButton id={tour.id} title={tour.title} redirectOnDelete />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
