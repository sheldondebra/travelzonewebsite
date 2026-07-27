import "server-only";

import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/db/config";

function getDatabaseHostname(databaseUrl: string) {
  try {
    const normalized = databaseUrl.replace(/^postgres(ql)?:/, "https:");
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function connectionRequiresSsl(databaseUrl: string) {
  const hostname = getDatabaseHostname(databaseUrl);
  if (
    hostname.endsWith(".supabase.co") ||
    hostname.includes("pooler.supabase.com") ||
    hostname.endsWith(".neon.tech")
  ) {
    return true;
  }

  try {
    const normalized = databaseUrl.replace(/^postgres(ql)?:/, "https:");
    const sslMode = new URL(normalized).searchParams.get("sslmode")?.toLowerCase();
    return sslMode === "require" || sslMode === "verify-ca" || sslMode === "verify-full";
  } catch {
    return false;
  }
}

export function createPostgresClient(databaseUrl: string) {
  const needsSsl = connectionRequiresSsl(databaseUrl);

  return postgres(databaseUrl, {
    max: 1,
    ssl: needsSsl ? "require" : false,
    connect_timeout: 10,
  });
}

let sharedClient: ReturnType<typeof postgres> | null = null;

export function getSql() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!sharedClient) {
    sharedClient = createPostgresClient(databaseUrl);
  }

  return sharedClient;
}

export async function withSql<T>(fn: (sql: ReturnType<typeof postgres>) => Promise<T>): Promise<T> {
  const sql = getSql();
  return fn(sql);
}
