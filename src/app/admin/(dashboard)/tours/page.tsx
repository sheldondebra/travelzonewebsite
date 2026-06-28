import { ToursDashboard } from "@/components/admin/ToursDashboard";
import { listAdminTours } from "@/lib/content-admin";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminToursPage() {
  const { role } = await requireStaff();
  const tours = await listAdminTours();

  return <ToursDashboard tours={tours} role={role} />;
}
