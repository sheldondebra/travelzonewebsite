export function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : String(error);
  return (
    code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("Could not find the table")
  );
}

export function databaseSetupError() {
  return new Error(
    "Database tables are not set up. Set DATABASE_URL in .env.local and run npm run bootstrap.",
  );
}

export function isDatabaseUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("connect ETIMEDOUT") ||
    message.includes("Connection terminated")
  );
}
