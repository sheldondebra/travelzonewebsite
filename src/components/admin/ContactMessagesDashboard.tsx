import Link from "next/link";
import { AdminPageHeader, AdminWidget } from "@/components/admin/AdminChrome";
import {
  ContactMessagesList,
  ContactMessagesSummary,
} from "@/components/admin/ContactMessagesList";
import type { ContactMessage } from "@/lib/contact-messages";

type Props = {
  messages: ContactMessage[];
};

export function ContactMessagesDashboard({ messages }: Props) {
  return (
    <>
      <AdminPageHeader
        title="Contact Messages"
        actions={
          <Link href="/contact" target="_blank" className="admin-button-secondary">
            View contact page
          </Link>
        }
      />

      <div className="admin-dashboard-columns mb-5">
        <AdminWidget title="Summary">
          <ContactMessagesSummary messages={messages} />
        </AdminWidget>
      </div>

      <ContactMessagesList messages={messages} />
    </>
  );
}
