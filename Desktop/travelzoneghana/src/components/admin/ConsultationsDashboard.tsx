import Link from "next/link";
import { AdminPageHeader, AdminWidget } from "@/components/admin/AdminChrome";
import {
  ConsultationsList,
  ConsultationsSummary,
} from "@/components/admin/ConsultationsList";
import type { ConsultationBooking } from "@/lib/consultations";

type Props = {
  bookings: ConsultationBooking[];
};

export function ConsultationsDashboard({ bookings }: Props) {
  return (
    <>
      <AdminPageHeader
        title="Consultations"
        actions={
          <Link href="/consultation" target="_blank" className="admin-button-secondary">
            View booking page
          </Link>
        }
      />

      <div className="admin-dashboard-columns mb-5">
        <AdminWidget title="Summary">
          <ConsultationsSummary bookings={bookings} />
        </AdminWidget>
      </div>

      <ConsultationsList bookings={bookings} />
    </>
  );
}
