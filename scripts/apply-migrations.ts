import { readFileSync } from "fs";
import { resolve } from "path";
import { getDatabaseUrl } from "./db-url";
import { loadLocalEnv } from "./load-env";
import { createPostgresClient } from "./postgres-client";

loadLocalEnv();

async function applyMigrations() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    console.error(`
Database connection not configured.

Add to .env.local:

  DATABASE_URL=postgresql://user:password@host:5432/postgres

For Hostinger, use the public Postgres URL (not the internal hostname).

Then run: npm run bootstrap
`);
    process.exit(1);
  }

  const sql = createPostgresClient(databaseUrl);

  try {
    const setupFile = resolve(process.cwd(), "db/schema.sql");
    await sql.unsafe(readFileSync(setupFile, "utf-8"));
    console.log("Applied db/schema.sql");
    console.log("Database setup complete.");
  } finally {
    await sql.end();
  }
}

applyMigrations().catch((error) => {
  console.error(error);
  process.exit(1);
});
