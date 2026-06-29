import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactMessageReplyForm } from "@/components/admin/ContactMessageReplyForm";
import { ContactMessageStatusForm } from "@/components/admin/ContactMessageStatusForm";
import { AdminPageHeader, AdminWidget } from "@/components/admin/AdminChrome";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatContactMessageDateTime } from "@/lib/contact-admin";
import { getContactSubjectLabel } from "@/lib/contact-messages";
import { getContactMessageById } from "@/lib/contact-messages-store";
import { isEmailConfigured, getSplitSmsConfig } from "@/lib/site-settings";
import { getStaffUser } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminMessageDetailPage({ params }: Props) {
  const { id } = await params;
  const message = await getContactMessageById(id);
  if (!message) notFound();

  const [staff, emailReady, sms] = await Promise.all([
    getStaffUser(),
    isEmailConfigured(),
    getSplitSmsConfig(),
  ]);

  return (
    <>
      <AdminPageHeader
        title={`Message ${message.id}`}
        description={`Submitted ${formatContactMessageDateTime(message.createdAt)}`}
        actions={
          <Link href="/admin/messages" className="admin-button-secondary">
            Back to list
          </Link>
        }
      />

      <div className="admin-dashboard-columns">
        <AdminWidget title="Message details">
          <table className="admin-list-table">
            <tbody>
              <DetailRow label="Sender" value={message.fullName} />
              <DetailRow
                label="Email"
                value={
                  <a href={`mailto:${message.email}`} className="text-[#2271b1]">
                    {message.email}
                  </a>
                }
              />
              <DetailRow
                label="Phone"
                value={
                  <a href={`tel:${message.phone}`} className="text-[#2271b1]">
                    {message.phone}
                  </a>
                }
              />
              <DetailRow
                label="Subject"
                value={getContactSubjectLabel(message.subject)}
              />
              <DetailRow label="Status" value={<StatusBadge status={message.status} />} />
              <DetailRow label="Message" value={message.message} />
            </tbody>
          </table>
        </AdminWidget>

        <div className="space-y-4">
          <AdminWidget title="Reply to customer">
            <ContactMessageReplyForm
              messageId={message.id}
              recipientEmail={message.email}
              recipientPhone={message.phone}
              emailReady={emailReady}
              smsReady={Boolean(sms)}
            />
          </AdminWidget>

          {staff?.role === "admin" ? (
            <AdminWidget title="Update status">
              <ContactMessageStatusForm
                messageId={message.id}
                currentStatus={message.status}
              />
            </AdminWidget>
          ) : null}
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <th className="w-40 font-semibold text-[#646970]">{label}</th>
      <td>{value}</td>
    </tr>
  );
}
