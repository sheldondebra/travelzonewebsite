export function getDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  return url || null;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}
