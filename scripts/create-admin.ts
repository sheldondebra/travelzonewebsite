import { getDatabaseUrl } from "./db-url";
import { loadLocalEnv } from "./load-env";
import { createPostgresClient } from "./postgres-client";
import { hashPassword } from "@/lib/auth/password";

loadLocalEnv();

const email = process.argv[2] ?? "support@tecunitgh.com";
const password = process.argv[3];

async function createAdmin() {
  if (!password) {
    console.error("Usage: npm run create-admin -- <email> <password>");
    process.exit(1);
  }

  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required in .env.local");
  }

  const sql = createPostgresClient(databaseUrl);
  const passwordHash = await hashPassword(password);

  try {
    const rows = await sql<{ id: string; email: string }[]>`
      insert into public.users (email, password_hash, role, is_active)
      values (lower(${email}), ${passwordHash}, 'admin', true)
      on conflict ((lower(email))) do update set
        password_hash = excluded.password_hash,
        role = 'admin',
        is_active = true,
        updated_at = now()
      returning id, email
    `;

    console.log(`Admin ready: ${rows[0]?.email ?? email}`);
  } finally {
    await sql.end();
  }
}

createAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
