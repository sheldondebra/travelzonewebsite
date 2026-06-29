import { ConsultationsDashboard } from "@/components/admin/ConsultationsDashboard";
import { listConsultations } from "@/lib/consultations-store";
import { getConsultationAvailability } from "@/lib/site-settings";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminConsultationsPage() {
  await requireStaff();
  const [bookings, availability] = await Promise.all([
    listConsultations(),
    getConsultationAvailability(),
  ]);

  return (
    <ConsultationsDashboard bookings={bookings} availability={availability} />
  );
}
