import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ConsultationBooking } from "@/lib/consultations";
import { isDatabaseConfigured } from "@/lib/db/config";
import { isMissingTableError } from "@/lib/db/errors";
import { getSql } from "@/lib/db/postgres";

const CONSULTATIONS_DIR = path.join(process.cwd(), "data");
const CONSULTATIONS_FILE = path.join(CONSULTATIONS_DIR, "consultations.json");

async function readAll(): Promise<ConsultationBooking[]> {
  try {
    const raw = await readFile(CONSULTATIONS_FILE, "utf-8");
    return JSON.parse(raw) as ConsultationBooking[];
  } catch {
    return [];
  }
}

async function writeAll(bookings: ConsultationBooking[]) {
  await mkdir(CONSULTATIONS_DIR, { recursive: true });
  await writeFile(CONSULTATIONS_FILE, JSON.stringify(bookings, null, 2));
}

function fromRow(row: Record<string, unknown>): ConsultationBooking {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    phone: row.phone as string,
    preferredDate: row.preferred_date as string,
    preferredTime: row.preferred_time as ConsultationBooking["preferredTime"],
    topic: row.topic as ConsultationBooking["topic"],
    mode: row.mode as ConsultationBooking["mode"],
    notes: (row.notes as string) ?? undefined,
    status: row.status as ConsultationBooking["status"],
    createdAt: row.created_at as string,
  };
}

export async function saveConsultation(booking: ConsultationBooking) {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      await sql`
        insert into public.consultation_bookings (
          id, full_name, email, phone, preferred_date, preferred_time,
          topic, mode, notes, status, created_at
        ) values (
          ${booking.id},
          ${booking.fullName},
          ${booking.email},
          ${booking.phone},
          ${booking.preferredDate},
          ${booking.preferredTime},
          ${booking.topic},
          ${booking.mode},
          ${booking.notes ?? null},
          ${booking.status},
          ${booking.createdAt}
        )
        on conflict (id) do update set
          full_name = excluded.full_name,
          email = excluded.email,
          phone = excluded.phone,
          preferred_date = excluded.preferred_date,
          preferred_time = excluded.preferred_time,
          topic = excluded.topic,
          mode = excluded.mode,
          notes = excluded.notes,
          status = excluded.status
      `;
      return;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const bookings = await readAll();
  const index = bookings.findIndex((item) => item.id === booking.id);
  if (index >= 0) bookings[index] = booking;
  else bookings.push(booking);
  await writeAll(bookings);
}

export async function getConsultationById(id: string) {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        select * from public.consultation_bookings where id = ${id} limit 1
      `;
      return rows[0] ? fromRow(rows[0]) : null;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const bookings = await readAll();
  return bookings.find((item) => item.id === id) ?? null;
}

export async function listConsultations() {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        select * from public.consultation_bookings
        order by created_at desc
      `;
      return rows.map((row) => fromRow(row));
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const bookings = await readAll();
  return bookings.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function updateConsultationStatus(
  id: string,
  status: ConsultationBooking["status"],
) {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        update public.consultation_bookings
        set status = ${status}
        where id = ${id}
        returning *
      `;
      if (!rows[0]) throw new Error("Consultation not found");
      return fromRow(rows[0]);
    } catch (error) {
      if (isMissingTableError(error)) {
        throw new Error("Consultation bookings table is not set up. Run npm run db:setup.");
      }
      throw error;
    }
  }

  const bookings = await readAll();
  const index = bookings.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Consultation not found");
  bookings[index] = { ...bookings[index], status };
  await writeAll(bookings);
  return bookings[index];
}

export function createConsultationId() {
  return randomUUID().slice(0, 8).toUpperCase();
}
