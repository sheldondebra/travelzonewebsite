import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { ExportNewsletterButton } from "@/components/admin/ExportNewsletterButton";
import { listNewsletterSubscribers } from "@/lib/newsletter-store";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminNewsletterPage() {
  await requireStaff();
  const subscribers = await listNewsletterSubscribers();

  return (
    <>
      <AdminPageHeader
        title="Newsletter"
        description={`${subscribers.length} subscriber${subscribers.length === 1 ? "" : "s"}`}
        actions={<ExportNewsletterButton />}
      />

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-6 text-[#646970]">
                  No subscribers yet.
                </td>
              </tr>
            ) : (
              subscribers.map((subscriber) => (
                <tr key={subscriber.email}>
                  <td>{subscriber.email}</td>
                  <td className="text-[#646970]">
                    {new Date(subscriber.createdAt).toLocaleString("en-GB")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
