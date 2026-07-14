import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { ContactMessage } from "@/lib/contact-messages";
import { isMissingTableError } from "@/lib/supabase/db-errors";

const MESSAGES_DIR = path.join(process.cwd(), "data");
const MESSAGES_FILE = path.join(MESSAGES_DIR, "contact-messages.json");

async function readAll(): Promise<ContactMessage[]> {
  try {
    const raw = await readFile(MESSAGES_FILE, "utf-8");
    return JSON.parse(raw) as ContactMessage[];
  } catch {
    return [];
  }
}

async function writeAll(messages: ContactMessage[]) {
  await mkdir(MESSAGES_DIR, { recursive: true });
  await writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function toRow(message: ContactMessage) {
  return {
    id: message.id,
    full_name: message.fullName,
    email: message.email,
    phone: message.phone,
    subject: message.subject,
    message: message.message,
    status: message.status,
    created_at: message.createdAt,
  };
}

function fromRow(row: Record<string, unknown>): ContactMessage {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    phone: row.phone as string,
    subject: row.subject as ContactMessage["subject"],
    message: row.message as string,
    status: row.status as ContactMessage["status"],
    createdAt: row.created_at as string,
  };
}

export async function saveContactMessage(message: ContactMessage) {
  const supabase = supabaseClient();
  if (supabase) {
    const { error } = await supabase.from("contact_messages").upsert(toRow(message));
    if (error) {
      if (isMissingTableError(error)) {
        const messages = await readAll();
        messages.push(message);
        await writeAll(messages);
        return;
      }
      throw new Error(error.message);
    }
    return;
  }

  const messages = await readAll();
  messages.push(message);
  await writeAll(messages);
}

export async function getContactMessageById(id: string) {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(error.message);
    }
    return data ? fromRow(data) : null;
  }

  const messages = await readAll();
  return messages.find((item) => item.id === id) ?? null;
}

export async function listContactMessages() {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTableError(error)) return readAll();
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => fromRow(row));
  }

  const messages = await readAll();
  return messages.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessage["status"],
) {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      if (isMissingTableError(error)) {
        throw new Error(
          "Contact messages table is not set up. Run supabase/setup-all.sql.",
        );
      }
      throw new Error(error.message);
    }
    return fromRow(data);
  }

  const messages = await readAll();
  const index = messages.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Contact message not found");
  messages[index] = { ...messages[index], status };
  await writeAll(messages);
  return messages[index];
}

export function createContactMessageId() {
  return randomUUID().slice(0, 8).toUpperCase();
}
