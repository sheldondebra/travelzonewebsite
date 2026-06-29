export function isMissingTableError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    Boolean(error.message?.includes("Could not find the table")) ||
    Boolean(error.message?.includes("schema cache"))
  );
}

/** Supabase write failed but a local JSON fallback is acceptable (dev / misconfigured RLS). */
export function isTicketRequestWriteFallbackError(error: {
  code?: string;
  message?: string;
}) {
  return (
    isMissingTableError(error) ||
    error.code === "42501" ||
    Boolean(error.message?.includes("row-level security"))
  );
}

export function databaseSetupError() {
  return new Error(
    "Database tables are not set up. Run supabase/setup-all.sql in the Supabase SQL Editor, then npm run seed.",
  );
}
