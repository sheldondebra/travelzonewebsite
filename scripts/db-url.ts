import { loadLocalEnv } from "./load-env";

loadLocalEnv();

export function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL?.trim() || null;
}

export function getDatabaseUrlSource(): string | null {
  return process.env.DATABASE_URL?.trim() ? "DATABASE_URL" : null;
}
