import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { ConsultationBooking } from "@/lib/consultations";
import { isMissingTableError } from "@/lib/supabase/db-errors";

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

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function toRow(booking: ConsultationBooking) {
  return {
    id: booking.id,
    full_name: booking.fullName,
    email: booking.email,
    phone: booking.phone,
    preferred_date: booking.preferredDate,
    preferred_time: booking.preferredTime,
    topic: booking.topic,
    mode: booking.mode,
    notes: booking.notes ?? null,
    status: booking.status,
    created_at: booking.createdAt,
  };
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
  const supabase = supabaseClient();
  if (supabase) {
    const { error } = await supabase.from("consultation_bookings").upsert(toRow(booking));
    if (error) {
      if (isMissingTableError(error)) {
        const bookings = await readAll();
        const index = bookings.findIndex((item) => item.id === booking.id);
        if (index >= 0) bookings[index] = booking;
        else bookings.push(booking);
        await writeAll(bookings);
        return;
      }
      throw new Error(error.message);
    }
    return;
  }

  const bookings = await readAll();
  const index = bookings.findIndex((item) => item.id === booking.id);
  if (index >= 0) bookings[index] = booking;
  else bookings.push(booking);
  await writeAll(bookings);
}

export async function getConsultationById(id: string) {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("consultation_bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(error.message);
    }
    return data ? fromRow(data) : null;
  }

  const bookings = await readAll();
  return bookings.find((item) => item.id === id) ?? null;
}

export async function listConsultations() {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("consultation_bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => fromRow(row));
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
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("consultation_bookings")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      if (isMissingTableError(error)) {
        throw new Error(
          "Consultation bookings table is not set up. Run supabase/setup-all.sql.",
        );
      }
      throw new Error(error.message);
    }
    return fromRow(data);
  }

  const bookings = await readAll();
  const index = bookings.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Consultation booking not found");
  bookings[index] = { ...bookings[index], status };
  await writeAll(bookings);
  return bookings[index];
}

export function createConsultationId() {
  return randomUUID().slice(0, 8).toUpperCase();
}
