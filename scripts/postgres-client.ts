import postgres from "postgres";

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

function normalizeDatabaseUrl(databaseUrl: string) {
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

/** Remote managed Postgres hosts may need SSL; local/VPS Postgres often does not. */
export function createPostgresClient(databaseUrl: string) {
  const connectionUrl = normalizeDatabaseUrl(databaseUrl);
  const needsSsl = connectionRequiresSsl(connectionUrl);

  return postgres(connectionUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: needsSsl ? "require" : false,
  });
}
