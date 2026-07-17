import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createResetToken,
  createSessionToken,
  getSessionFromServer,
  hashResetToken,
  setSessionCookieOnServer,
} from "@/lib/auth/session";
import type { StaffRole, StaffUser } from "@/lib/auth/types";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSql } from "@/lib/db/postgres";

type DbUserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: StaffRole;
  display_name: string;
  is_active: boolean;
};

export type { StaffRole, StaffUser };

export async function findUserByEmail(email: string) {
  const sql = getSql();
  const rows = await sql<DbUserRow[]>`
    select id, email, password_hash, role, display_name, is_active
    from public.users
    where lower(email) = lower(${email})
    limit 1
  `;
  return rows[0] ?? null;
}

export async function findUserById(id: string) {
  const sql = getSql();
  const rows = await sql<DbUserRow[]>`
    select id, email, password_hash, role, display_name, is_active
    from public.users
    where id = ${id}::uuid
    limit 1
  `;
  return rows[0] ?? null;
}

export async function authenticateStaff(email: string, password: string): Promise<StaffUser | null> {
  const user = await findUserByEmail(email);
  if (!user || !user.is_active) return null;
  if (!(await verifyPassword(password, user.password_hash))) return null;
  if (user.role !== "admin" && user.role !== "editor") return null;

  return {
    user: { id: user.id, email: user.email },
    role: user.role,
  };
}

export async function createStaffSession(staff: StaffUser) {
  const token = await createSessionToken({
    sub: staff.user.id,
    email: staff.user.email,
    role: staff.role,
  });
  await setSessionCookieOnServer(token);
}

export async function getStaffUser(): Promise<StaffUser | null> {
  if (!isDatabaseConfigured()) return null;

  const session = await getSessionFromServer();
  if (!session) return null;

  try {
    const user = await findUserById(session.sub);
    if (!user || !user.is_active) return null;
    if (user.role !== "admin" && user.role !== "editor") return null;

    return {
      user: { id: user.id, email: user.email },
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function requireStaff() {
  if (!isDatabaseConfigured()) redirect("/admin/setup");
  const staff = await getStaffUser();
  if (!staff) redirect("/admin/login");
  return staff;
}

export async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin?error=forbidden");
  return staff;
}

export async function createStaffUser(input: {
  email: string;
  password: string;
  role: StaffRole;
  displayName?: string;
}) {
  const sql = getSql();
  const passwordHash = await hashPassword(input.password);
  const rows = await sql<{ id: string; email: string }[]>`
    insert into public.users (email, password_hash, role, display_name, is_active)
    values (
      lower(${input.email}),
      ${passwordHash},
      ${input.role},
      ${input.displayName ?? ""},
      true
    )
    on conflict ((lower(email))) do update set
      password_hash = excluded.password_hash,
      role = excluded.role,
      display_name = excluded.display_name,
      is_active = true,
      updated_at = now()
    returning id, email
  `;
  return rows[0];
}

export async function updateStaffUserPassword(userId: string, password: string) {
  const sql = getSql();
  const passwordHash = await hashPassword(password);
  await sql`
    update public.users
    set password_hash = ${passwordHash}, updated_at = now()
    where id = ${userId}::uuid
  `;
}

export async function updateStaffUserRole(userId: string, role: StaffRole) {
  const sql = getSql();
  await sql`
    update public.users
    set role = ${role}, updated_at = now()
    where id = ${userId}::uuid
  `;
}

export async function deleteStaffUser(userId: string) {
  const sql = getSql();
  await sql`delete from public.users where id = ${userId}::uuid`;
}

export async function listActiveStaffUsers() {
  const sql = getSql();
  return sql<{ id: string; email: string; role: StaffRole; created_at: string }[]>`
    select id, email, role, created_at
    from public.users
    where is_active = true
    order by email
  `;
}

export async function createPasswordResetToken(email: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.is_active) return null;

  const token = createResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const sql = getSql();

  await sql`
    delete from public.password_reset_tokens
    where user_id = ${user.id}::uuid
  `;

  await sql`
    insert into public.password_reset_tokens (user_id, token_hash, expires_at)
    values (${user.id}::uuid, ${tokenHash}, ${expiresAt}::timestamptz)
  `;

  return { token, email: user.email };
}

export async function consumePasswordResetToken(token: string) {
  const tokenHash = hashResetToken(token);
  const sql = getSql();
  const rows = await sql<{ user_id: string; email: string }[]>`
    select t.user_id, u.email
    from public.password_reset_tokens t
    join public.users u on u.id = t.user_id
    where t.token_hash = ${tokenHash}
      and t.expires_at > now()
      and u.is_active = true
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  await sql`
    delete from public.password_reset_tokens
    where token_hash = ${tokenHash}
  `;

  return { userId: row.user_id, email: row.email };
}
