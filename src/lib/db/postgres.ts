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

/**
 * Normalize managed-Postgres URLs for the Node `postgres` client.
 * Neon often appends `channel_binding=require`, which can hang TLS handshakes
 * during Next.js static generation.
 */
export function normalizeDatabaseUrl(databaseUrl: string) {
  try {
    const normalized = databaseUrl.replace(/^postgres(ql)?:/, "https:");
    const url = new URL(normalized);
    url.searchParams.delete("channel_binding");
    if (!url.searchParams.get("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
    return url.toString().replace(/^https:/, "postgresql:");
  } catch {
    return databaseUrl;
  }
}

export function createPostgresClient(databaseUrl: string) {
  const connectionUrl = normalizeDatabaseUrl(databaseUrl);
  const needsSsl = connectionRequiresSsl(connectionUrl);

  return postgres(connectionUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 5,
    prepare: false,
    ssl: needsSsl ? "require" : false,
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

export async function withSqlTimeout<T>(
  work: (sql: ReturnType<typeof postgres>) => Promise<T>,
  timeoutMs = 8000,
): Promise<T> {
  const sql = getSql();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const pending = work(sql);
  // Prevent unhandled rejection if the query settles after a timeout win.
  void pending.catch(() => undefined);

  try {
    return await Promise.race([
      pending,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Database query timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function withSql<T>(fn: (sql: ReturnType<typeof postgres>) => Promise<T>): Promise<T> {
  const sql = getSql();
  return fn(sql);
}
