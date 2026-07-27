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

/** Remote managed Postgres hosts may need SSL; local/VPS Postgres often does not. */
export function createPostgresClient(databaseUrl: string) {
  const needsSsl = connectionRequiresSsl(databaseUrl);

  return postgres(databaseUrl, {
    max: 1,
    ssl: needsSsl ? "require" : false,
    connect_timeout: 10,
  });
}
