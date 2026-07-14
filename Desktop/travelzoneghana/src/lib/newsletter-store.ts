import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type NewsletterSubscriber = {
  email: string;
  createdAt: string;
};

const NEWSLETTER_DIR = path.join(process.cwd(), "data");
const NEWSLETTER_FILE = path.join(NEWSLETTER_DIR, "newsletter.json");

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseJs(url, key);
}

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

function isMissingTableError(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    Boolean(error.message?.includes("Could not find the table")) ||
    Boolean(error.message?.includes("schema cache"))
  );
}

export async function saveNewsletterSubscriber(email: string) {
  const normalized = email.trim().toLowerCase();
  const supabase = supabaseClient();

  if (supabase) {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: normalized });
    if (error?.code === "23505") {
      return { alreadySubscribed: true as const };
    }
    if (error && isMissingTableError(error)) {
      // DB not migrated yet — fall back to local JSON
    } else if (error) {
      throw new Error(error.message);
    } else {
      return { alreadySubscribed: false as const };
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
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("email, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTableError(error)) return readAll();
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => ({
      email: row.email as string,
      createdAt: row.created_at as string,
    }));
  }

  return readAll();
}
