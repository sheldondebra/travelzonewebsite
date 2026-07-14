import { loadLocalEnv } from "./load-env";

loadLocalEnv();

export function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;
}

/** Env vars checked in order (first match wins). */
const DIRECT_DATABASE_URL_KEYS = [
  "DATABASE_URL",
  "SUPABASE_DATABASE_URL",
  "SUPABASE_DB_URL",
] as const;

const DATABASE_PASSWORD_KEYS = [
  "SUPABASE_DB_PASSWORD",
  "DB_PASSWORD",
] as const;

export function getDatabaseUrl(): string | null {
  for (const key of DIRECT_DATABASE_URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  let password: string | undefined;
  for (const key of DATABASE_PASSWORD_KEYS) {
    const value = process.env[key]?.trim();
    if (value) {
      password = value;
      break;
    }
  }

  const ref = getProjectRef();
  if (!password || !ref) return null;

  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

export function getDatabaseUrlSource(): string | null {
  for (const key of DIRECT_DATABASE_URL_KEYS) {
    if (process.env[key]?.trim()) return key;
  }
  for (const key of DATABASE_PASSWORD_KEYS) {
    if (process.env[key]?.trim()) return key;
  }
  return null;
}
