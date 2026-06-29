import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { TourBooking } from "@/lib/bookings";
import { isMissingTableError } from "@/lib/supabase/db-errors";

const BOOKINGS_DIR = path.join(process.cwd(), "data");
const BOOKINGS_FILE = path.join(BOOKINGS_DIR, "bookings.json");

async function readAll(): Promise<TourBooking[]> {
  try {
    const raw = await readFile(BOOKINGS_FILE, "utf-8");
    return JSON.parse(raw) as TourBooking[];
  } catch {
    return [];
  }
}

async function writeAll(bookings: TourBooking[]) {
  await mkdir(BOOKINGS_DIR, { recursive: true });
  await writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function toRow(booking: TourBooking) {
  return {
    id: booking.id,
    tour_slug: booking.tourSlug,
    tour_title: booking.tourTitle,
    full_name: booking.fullName,
    email: booking.email,
    phone: booking.phone,
    travel_date: booking.travelDate,
    travelers: booking.travelers,
    special_requests: booking.specialRequests ?? null,
    estimated_total: booking.estimatedTotal,
    currency: booking.currency,
    status: booking.status,
    payment_status: booking.paymentStatus,
    paystack_reference: booking.paystackReference ?? null,
    paid_amount: booking.paidAmount ?? null,
    paid_at: booking.paidAt ?? null,
    created_at: booking.createdAt,
  };
}

function fromRow(row: Record<string, unknown>): TourBooking {
  return {
    id: row.id as string,
    tourSlug: row.tour_slug as string,
    tourTitle: row.tour_title as string,
    fullName: row.full_name as string,
    email: row.email as string,
    phone: row.phone as string,
    travelDate: row.travel_date as string,
    travelers: row.travelers as number,
    specialRequests: (row.special_requests as string) ?? undefined,
    estimatedTotal: Number(row.estimated_total),
    currency: (row.currency as "GHS") ?? "GHS",
    status: row.status as TourBooking["status"],
    paymentStatus: row.payment_status as TourBooking["paymentStatus"],
    paystackReference: (row.paystack_reference as string) ?? undefined,
    paidAmount: row.paid_amount != null ? Number(row.paid_amount) : undefined,
    paidAt: (row.paid_at as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function saveBooking(booking: TourBooking) {
  const supabase = supabaseClient();
  if (supabase) {
    const { error } = await supabase.from("tour_bookings").upsert(toRow(booking));
    if (error) {
      if (isMissingTableError(error)) {
        const bookings = await readAll();
        const index = bookings.findIndex((b) => b.id === booking.id);
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
  const index = bookings.findIndex((b) => b.id === booking.id);
  if (index >= 0) bookings[index] = booking;
  else bookings.push(booking);
  await writeAll(bookings);
}

export async function getBookingById(id: string) {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("tour_bookings")
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
  return bookings.find((b) => b.id === id) ?? null;
}

export async function getBookingByReference(reference: string) {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("tour_bookings")
      .select("*")
      .eq("paystack_reference", reference)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(error.message);
    }
    return data ? fromRow(data) : null;
  }

  const bookings = await readAll();
  return bookings.find((b) => b.paystackReference === reference) ?? null;
}

export async function listBookings() {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("tour_bookings")
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

export async function updateBookingStatus(
  id: string,
  status: TourBooking["status"],
) {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("tour_bookings")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      if (isMissingTableError(error)) {
        throw new Error("Bookings table is not set up. Run supabase/setup-all.sql.");
      }
      throw new Error(error.message);
    }
    return fromRow(data);
  }

  const bookings = await readAll();
  const index = bookings.findIndex((b) => b.id === id);
  if (index < 0) throw new Error("Booking not found");
  bookings[index] = { ...bookings[index], status };
  await writeAll(bookings);
  return bookings[index];
}

export function createBookingId() {
  return randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
}

export function createPaystackReference(bookingId: string) {
  return `TZ-${bookingId}-${Date.now()}`;
}
