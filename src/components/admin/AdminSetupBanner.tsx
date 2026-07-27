import Link from "next/link";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { isDatabaseConfigured } from "@/lib/db/config";
import { isMissingTableError } from "@/lib/db/errors";
import { getSql } from "@/lib/db/postgres";

export async function isDatabaseSetupNeeded() {
  if (!isDatabaseConfigured()) return true;

  try {
    await getSql()`select id from public.tours limit 1`;
    return false;
  } catch (error) {
    return isMissingTableError(error);
  }
}

export async function AdminSetupBanner() {
  const needed = await isDatabaseSetupNeeded();
  if (!needed) return null;

  return (
    <AdminNotice variant="warning">
      <p className="font-semibold">Database setup required</p>
      <p className="mt-1">
        Admin tables are not created yet. Run{" "}
        <code className="rounded bg-[#f3efe8] px-1">npm run bootstrap</code> locally
        (requires <code className="rounded bg-[#f3efe8] px-1">DATABASE_URL</code> in{" "}
        <code className="rounded bg-[#f3efe8] px-1">.env.local</code>), then{" "}
        <code className="rounded bg-[#f3efe8] px-1">npm run create-admin</code> to add
        your first admin user.
      </p>
      <p className="mt-2">
        <Link href="/admin/setup" className="text-navy hover:text-brand-red">
          View setup instructions
        </Link>
      </p>
    </AdminNotice>
  );
}
