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

export function createPostgresClient(databaseUrl: string) {
  const hostname = getDatabaseHostname(databaseUrl);
  const needsSsl =
    hostname.endsWith(".supabase.co") || hostname.includes("pooler.supabase.com");

  return postgres(databaseUrl, {
    max: 1,
    ssl: needsSsl ? "require" : false,
    connect_timeout: 15,
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
