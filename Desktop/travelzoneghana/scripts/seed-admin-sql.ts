import { randomUUID } from "crypto";
import postgres from "postgres";
import { getDatabaseUrl } from "./db-url";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

const email = process.argv[2] ?? "support@tecunitgh.com";
const password = process.argv[3];

async function seedAdmin() {
  if (!password) {
    console.error("Usage: npx tsx scripts/seed-admin-sql.ts <email> <password>");
    process.exit(1);
  }

  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or SUPABASE_DB_PASSWORD is required.");
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    const existing = await sql<{ id: string; email: string }[]>`
      select id, email from auth.users where lower(email) = lower(${email})
    `;

    if (existing.length > 0) {
      const userId = existing[0].id;
      await sql`
        update auth.users
        set
          encrypted_password = crypt(${password}, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
          updated_at = now()
        where id = ${userId}::uuid
      `;
      await sql`
        insert into public.users (id, email, role)
        values (${userId}::uuid, lower(${email}), 'admin')
        on conflict (id) do update set
          email = excluded.email,
          role = excluded.role,
          is_active = true,
          updated_at = now()
      `;
      console.log(`Updated existing admin: ${email}`);
      return;
    }

    const userId = randomUUID();

    await sql`
      insert into auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) values (
        ${userId}::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        ${email},
        crypt(${password}, gen_salt('bf')),
        now(),
        '{"role":"admin"}'::jsonb,
        '{}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
      )
    `;

    await sql`
      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) values (
        ${userId}::uuid,
        ${userId}::uuid,
        ${sql.json({ sub: userId, email })},
        'email',
        ${userId},
        now(),
        now(),
        now()
      )
    `;

    await sql`
      insert into public.users (id, email, role)
      values (${userId}::uuid, lower(${email}), 'admin')
      on conflict (id) do update set
        email = excluded.email,
        role = excluded.role,
        is_active = true,
        updated_at = now()
    `;

    console.log(`Created admin: ${email}`);
  } finally {
    await sql.end();
  }
}

seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
