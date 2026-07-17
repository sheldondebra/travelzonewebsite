import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ContactMessage } from "@/lib/contact-messages";
import { isDatabaseConfigured } from "@/lib/db/config";
import { isMissingTableError } from "@/lib/db/errors";
import { getSql } from "@/lib/db/postgres";

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
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      await sql`
        insert into public.contact_messages (
          id, full_name, email, phone, subject, message, status, created_at
        ) values (
          ${message.id},
          ${message.fullName},
          ${message.email},
          ${message.phone},
          ${message.subject},
          ${message.message},
          ${message.status},
          ${message.createdAt}
        )
        on conflict (id) do update set
          full_name = excluded.full_name,
          email = excluded.email,
          phone = excluded.phone,
          subject = excluded.subject,
          message = excluded.message,
          status = excluded.status
      `;
      return;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const messages = await readAll();
  messages.push(message);
  await writeAll(messages);
}

export async function getContactMessageById(id: string) {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        select * from public.contact_messages where id = ${id} limit 1
      `;
      return rows[0] ? fromRow(rows[0]) : null;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const messages = await readAll();
  return messages.find((item) => item.id === id) ?? null;
}

export async function listContactMessages() {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        select * from public.contact_messages
        order by created_at desc
      `;
      return rows.map((row) => fromRow(row));
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
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
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        update public.contact_messages
        set status = ${status}
        where id = ${id}
        returning *
      `;
      if (!rows[0]) throw new Error("Contact message not found");
      return fromRow(rows[0]);
    } catch (error) {
      if (isMissingTableError(error)) {
        throw new Error("Contact messages table is not set up. Run npm run db:setup.");
      }
      throw error;
    }
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
