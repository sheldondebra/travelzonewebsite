import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { TourForm } from "@/components/admin/TourForm";

export default function NewTourPage() {
  return (
    <>
      <AdminPageHeader
        title="New tour"
        description="Add the essentials now — photos, highlights, and extras can follow."
        actions={
          <Link href="/admin/tours" className="admin-button-secondary">
            All tours
          </Link>
        }
      />
      <TourForm />
    </>
  );
}
