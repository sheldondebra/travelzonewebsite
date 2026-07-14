export function isMissingTableError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST205" ||
    Boolean(error.message?.includes("Could not find the table")) ||
    Boolean(error.message?.includes("schema cache"))
  );
}

export function databaseSetupError() {
  return new Error(
    "Database tables are not set up. Run supabase/setup-all.sql in the Supabase SQL Editor, then npm run seed.",
  );
}
