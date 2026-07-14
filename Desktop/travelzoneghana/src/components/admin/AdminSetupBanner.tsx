import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/db-errors";
import { AdminNotice } from "@/components/admin/AdminChrome";

export async function isDatabaseSetupNeeded() {
  const supabase = await createClient();
  const { error } = await supabase.from("tours").select("id", { head: true, count: "exact" });
  return Boolean(error && isMissingTableError(error));
}

export async function AdminSetupBanner() {
  const needed = await isDatabaseSetupNeeded();
  if (!needed) return null;

  return (
    <AdminNotice variant="warning">
      <p className="font-semibold">Database setup required</p>
      <p className="mt-1">
        Admin tables are not created yet. Either run{" "}
        <code className="bg-[#f0f0f1] px-1">npm run bootstrap</code> locally
        (requires <code className="bg-[#f0f0f1] px-1">DATABASE_URL</code> or{" "}
        <code className="bg-[#f0f0f1] px-1">DB_PASSWORD</code> in{" "}
        <code className="bg-[#f0f0f1] px-1">.env.local</code>), or paste{" "}
        <code className="bg-[#f0f0f1] px-1">supabase/setup-all.sql</code> in the{" "}
        <a
          href="https://supabase.com/dashboard/project/xdegzidfeccjeajedxes/sql/new"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2271b1] hover:text-[#135e96]"
        >
          Supabase SQL Editor
        </a>
        , then run <code className="bg-[#f0f0f1] px-1">npm run seed</code>.
      </p>
      <p className="mt-2">
        <Link href="/admin/setup" className="text-[#2271b1] hover:text-[#135e96]">
          View setup instructions
        </Link>
      </p>
    </AdminNotice>
  );
}
