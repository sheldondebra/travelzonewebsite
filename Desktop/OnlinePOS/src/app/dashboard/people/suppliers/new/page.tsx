import { redirect } from "next/navigation";

export default function LegacyNewSupplierPage() {
  redirect("/dashboard/suppliers/new");
}
