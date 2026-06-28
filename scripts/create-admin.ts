import { createAdminClient } from "@/lib/supabase/admin";
import { upsertStaffUserRecord } from "@/lib/staff-users";
import type { StaffRole } from "@/lib/supabase/auth";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

const email = process.argv[2] ?? "support@tecunitgh.com";
const password = process.argv[3];

async function createAdmin() {
  if (!password) {
    console.error("Usage: npm run create-admin -- <email> <password>");
    process.exit(1);
  }

  const admin = createAdminClient();

  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  if (found) {
    const { data, error } = await admin.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
    });
    if (error) throw new Error(error.message);

    await upsertStaffUserRecord({
      id: data.user.id,
      email: data.user.email ?? email,
      role: "admin",
    });

    console.log(`Updated existing admin: ${data.user.email}`);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" as StaffRole },
  });

  if (error) throw new Error(error.message);

  await upsertStaffUserRecord({
    id: data.user.id,
    email: data.user.email ?? email,
    role: "admin",
  });

  console.log(`Created admin: ${data.user.email}`);
}

createAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
