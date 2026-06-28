import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { TourForm } from "@/components/admin/TourForm";

export default function NewTourPage() {
  return (
    <>
      <AdminPageHeader
        title="Add New Tour"
        description="Fill in the basics, upload photos, and publish when ready."
        actions={
          <Link href="/admin/tours" className="admin-button-secondary">
            Back to Tours
          </Link>
        }
      />
      <TourForm />
    </>
  );
}
