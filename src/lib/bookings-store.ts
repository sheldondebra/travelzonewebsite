import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { TourBooking } from "@/lib/bookings";
import { isDatabaseConfigured } from "@/lib/db/config";
import { isMissingTableError } from "@/lib/db/errors";
import { getSql } from "@/lib/db/postgres";

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
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      await sql`
        insert into public.tour_bookings (
          id, tour_slug, tour_title, full_name, email, phone, travel_date,
          travelers, special_requests, estimated_total, currency, status,
          payment_status, paystack_reference, paid_amount, paid_at, created_at
        ) values (
          ${booking.id},
          ${booking.tourSlug},
          ${booking.tourTitle},
          ${booking.fullName},
          ${booking.email},
          ${booking.phone},
          ${booking.travelDate},
          ${booking.travelers},
          ${booking.specialRequests ?? null},
          ${booking.estimatedTotal},
          ${booking.currency},
          ${booking.status},
          ${booking.paymentStatus},
          ${booking.paystackReference ?? null},
          ${booking.paidAmount ?? null},
          ${booking.paidAt ?? null},
          ${booking.createdAt}
        )
        on conflict (id) do update set
          tour_slug = excluded.tour_slug,
          tour_title = excluded.tour_title,
          full_name = excluded.full_name,
          email = excluded.email,
          phone = excluded.phone,
          travel_date = excluded.travel_date,
          travelers = excluded.travelers,
          special_requests = excluded.special_requests,
          estimated_total = excluded.estimated_total,
          currency = excluded.currency,
          status = excluded.status,
          payment_status = excluded.payment_status,
          paystack_reference = excluded.paystack_reference,
          paid_amount = excluded.paid_amount,
          paid_at = excluded.paid_at
      `;
      return;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const bookings = await readAll();
  const index = bookings.findIndex((b) => b.id === booking.id);
  if (index >= 0) bookings[index] = booking;
  else bookings.push(booking);
  await writeAll(bookings);
}

export async function getBookingById(id: string) {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`select * from public.tour_bookings where id = ${id} limit 1`;
      return rows[0] ? fromRow(rows[0]) : null;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const bookings = await readAll();
  return bookings.find((b) => b.id === id) ?? null;
}

export async function getBookingByReference(reference: string) {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        select * from public.tour_bookings
        where paystack_reference = ${reference}
        limit 1
      `;
      return rows[0] ? fromRow(rows[0]) : null;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const bookings = await readAll();
  return bookings.find((b) => b.paystackReference === reference) ?? null;
}

export async function listBookings() {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        select * from public.tour_bookings
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

export async function updateBookingStatus(id: string, status: TourBooking["status"]) {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        update public.tour_bookings
        set status = ${status}
        where id = ${id}
        returning *
      `;
      if (!rows[0]) throw new Error("Booking not found");
      return fromRow(rows[0]);
    } catch (error) {
      if (isMissingTableError(error)) {
        throw new Error("Bookings table is not set up. Run npm run db:setup.");
      }
      throw error;
    }
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
