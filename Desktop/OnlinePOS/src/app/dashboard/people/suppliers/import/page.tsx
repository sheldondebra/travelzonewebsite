import { redirect } from "next/navigation";

export default function LegacyImportSuppliersPage() {
  redirect("/dashboard/suppliers/import");
}
