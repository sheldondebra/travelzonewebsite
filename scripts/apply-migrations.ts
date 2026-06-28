import { readFileSync } from "fs";
import { resolve } from "path";
import postgres from "postgres";
import { getDatabaseUrl } from "./db-url";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

async function applyMigrations() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    console.error(`
Database connection not configured.

Add ONE of these to .env.local:

  DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  # Copy the full URI from Supabase → Project Settings → Database → Connection string

  — or —

  DB_PASSWORD=your_database_password
  # Uses NEXT_PUBLIC_SUPABASE_URL to build the connection (legacy direct host)

Then run: npm run bootstrap

Or paste supabase/setup-all.sql into:
  https://supabase.com/dashboard/project/xdegzidfeccjeajedxes/sql/new
`);
    process.exit(1);
  }

  const sqlFile = resolve(process.cwd(), "supabase/setup-all.sql");
  const migrationSql = readFileSync(sqlFile, "utf-8");
  const sql = postgres(databaseUrl, { max: 1, ssl: "require" });

  try {
    await sql.unsafe(migrationSql);
    console.log("Database setup complete.");
  } finally {
    await sql.end();
  }
}

applyMigrations().catch((error) => {
  console.error(error);
  process.exit(1);
});
