import { ConsultationsDashboard } from "@/components/admin/ConsultationsDashboard";
import { listConsultations } from "@/lib/consultations-store";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminConsultationsPage() {
  await requireStaff();
  const bookings = await listConsultations();

  return <ConsultationsDashboard bookings={bookings} />;
}
