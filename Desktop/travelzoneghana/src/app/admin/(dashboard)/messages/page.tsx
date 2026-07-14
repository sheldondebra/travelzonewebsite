import { ContactMessagesDashboard } from "@/components/admin/ContactMessagesDashboard";
import { listContactMessages } from "@/lib/contact-messages-store";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminMessagesPage() {
  await requireStaff();
  const messages = await listContactMessages();

  return <ContactMessagesDashboard messages={messages} />;
}
