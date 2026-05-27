import { redirect } from "next/navigation";

export default function LegacyCustomersPage() {
  redirect("/dashboard/people/customers");
}
