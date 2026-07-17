import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { isDatabaseConfigured } from "@/lib/db/config";
import { isMissingTableError } from "@/lib/db/errors";
import { getSql } from "@/lib/db/postgres";

export type NewsletterSubscriber = {
  email: string;
  createdAt: string;
};

const NEWSLETTER_DIR = path.join(process.cwd(), "data");
const NEWSLETTER_FILE = path.join(NEWSLETTER_DIR, "newsletter.json");

async function readAll(): Promise<NewsletterSubscriber[]> {
  try {
    const raw = await readFile(NEWSLETTER_FILE, "utf-8");
    return JSON.parse(raw) as NewsletterSubscriber[];
  } catch {
    return [];
  }
}

async function writeAll(subscribers: NewsletterSubscriber[]) {
  await mkdir(NEWSLETTER_DIR, { recursive: true });
  await writeFile(NEWSLETTER_FILE, JSON.stringify(subscribers, null, 2));
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String(error.code) === "23505"
  );
}

export async function saveNewsletterSubscriber(email: string) {
  const normalized = email.trim().toLowerCase();

  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      await sql`
        insert into public.newsletter_subscribers (email)
        values (${normalized})
      `;
      return { alreadySubscribed: false as const };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { alreadySubscribed: true as const };
      }
      if (!isMissingTableError(error)) throw error;
    }
  }

  const subscribers = await readAll();
  if (subscribers.some((entry) => entry.email === normalized)) {
    return { alreadySubscribed: true as const };
  }

  subscribers.push({
    email: normalized,
    createdAt: new Date().toISOString(),
  });

  await writeAll(subscribers);
  return { alreadySubscribed: false as const };
}

export async function listNewsletterSubscribers() {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        select email, created_at
        from public.newsletter_subscribers
        order by created_at desc
      `;
      return rows.map((row) => ({
        email: row.email as string,
        createdAt: row.created_at as string,
      }));
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  return readAll();
}
