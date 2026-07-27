import { redirect } from "next/navigation";

/** Common mistaken path — staff auth lives under /admin/login. */
export default function LoginAliasPage() {
  redirect("/admin/login");
}
