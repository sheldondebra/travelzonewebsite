import postgres from "postgres";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";
import { getDatabaseUrl } from "./db-url";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

async function seedSiteSettings() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or SUPABASE_DB_PASSWORD is required.");
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    const [admin] = await sql<{ id: string }[]>`
      select id from auth.users
      where lower(email) = lower('support@tecunitgh.com')
      limit 1
    `;

    await sql`
      insert into public.site_settings (id, data, updated_by)
      values (
        'default',
        ${sql.json(DEFAULT_SITE_SETTINGS)},
        ${admin?.id ?? null}
      )
      on conflict (id) do update set
        data = excluded.data,
        updated_by = coalesce(excluded.updated_by, public.site_settings.updated_by),
        updated_at = now()
    `;

    console.log("Seeded default site_settings row.");
  } finally {
    await sql.end();
  }
}

seedSiteSettings().catch((error) => {
  console.error(error);
  process.exit(1);
});
