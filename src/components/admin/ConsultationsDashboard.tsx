import Link from "next/link";
import { AdminPageHeader, AdminWidget } from "@/components/admin/AdminChrome";
import { ConsultationAvailabilityForm } from "@/components/admin/ConsultationAvailabilityForm";
import { ConsultationsList } from "@/components/admin/ConsultationsList";
import type { ConsultationBooking } from "@/lib/consultations";
import type { ConsultationAvailabilitySettings } from "@/lib/settings-types";

type Props = {
  bookings: ConsultationBooking[];
  availability: ConsultationAvailabilitySettings;
};

export function ConsultationsDashboard({ bookings, availability }: Props) {
  return (
    <>
      <AdminPageHeader
        title="Consultations"
        description="Free consultation requests and booking schedule from the public site."
        actions={
          <Link href="/consultation" target="_blank" className="admin-button-secondary">
            View booking page
          </Link>
        }
      />

      <AdminWidget title="Booking schedule" className="admin-schedule-widget">
        <ConsultationAvailabilityForm availability={availability} canEdit={true} />
      </AdminWidget>

      <ConsultationsList bookings={bookings} />
    </>
  );
}
