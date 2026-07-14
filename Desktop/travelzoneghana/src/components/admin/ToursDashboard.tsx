import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { ToursList } from "@/components/admin/ToursList";
import type { AdminTour } from "@/lib/content-types";
import type { StaffRole } from "@/lib/supabase/auth";

type Props = {
  tours: AdminTour[];
  role: StaffRole;
};

export function ToursDashboard({ tours, role }: Props) {
  return (
    <>
      <AdminPageHeader
        title="Tours"
        description="Create and manage tour packages shown on the public site."
        actions={
          <Link href="/admin/tours/new" className="admin-button-primary">
            Add New
          </Link>
        }
      />
      <ToursList tours={tours} role={role} />
    </>
  );
}
