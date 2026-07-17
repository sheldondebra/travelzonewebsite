import postgres from "postgres";

function getDatabaseHostname(databaseUrl: string) {
  try {
    const normalized = databaseUrl.replace(/^postgres(ql)?:/, "https:");
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Remote managed Postgres hosts may need SSL; Hostinger VPS Postgres typically does not. */
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
