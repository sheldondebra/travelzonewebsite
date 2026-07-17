import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { isDatabaseConfigured } from "@/lib/db/config";
import { isMissingTableError } from "@/lib/db/errors";
import { getSql } from "@/lib/db/postgres";
import type { TicketRequest, TicketRequestStatus } from "@/lib/ticket-requests";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "ticket-requests.json");

async function readAll(): Promise<TicketRequest[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as TicketRequest[];
  } catch {
    return [];
  }
}

async function writeAll(requests: TicketRequest[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(requests, null, 2));
}

function fromRow(row: Record<string, unknown>): TicketRequest {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    phone: row.phone as string,
    tripType: row.trip_type as TicketRequest["tripType"],
    origin: row.origin as string,
    destination: row.destination as string,
    departureDate: row.departure_date as string,
    returnDate: (row.return_date as string) ?? undefined,
    passengers: Number(row.passengers),
    cabinClass: row.cabin_class as TicketRequest["cabinClass"],
    flexibleDates: Boolean(row.flexible_dates),
    notes: (row.notes as string) ?? undefined,
    status: row.status as TicketRequest["status"],
    createdAt: row.created_at as string,
  };
}

async function persistTicketRequestLocally(request: TicketRequest) {
  const requests = await readAll();
  const index = requests.findIndex((item) => item.id === request.id);
  if (index >= 0) requests[index] = request;
  else requests.push(request);
  await writeAll(requests);
}

export async function saveTicketRequest(request: TicketRequest) {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      await sql`
        insert into public.ticket_booking_requests (
          id, full_name, email, phone, trip_type, origin, destination,
          departure_date, return_date, passengers, cabin_class,
          flexible_dates, notes, status, created_at
        ) values (
          ${request.id},
          ${request.fullName},
          ${request.email},
          ${request.phone},
          ${request.tripType},
          ${request.origin},
          ${request.destination},
          ${request.departureDate},
          ${request.returnDate ?? null},
          ${request.passengers},
          ${request.cabinClass},
          ${request.flexibleDates},
          ${request.notes ?? null},
          ${request.status},
          ${request.createdAt}
        )
      `;
      return;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
      await persistTicketRequestLocally(request);
      return;
    }
  }

  await persistTicketRequestLocally(request);
}

export async function getTicketRequestById(id: string) {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        select * from public.ticket_booking_requests where id = ${id} limit 1
      `;
      return rows[0] ? fromRow(rows[0]) : null;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const requests = await readAll();
  return requests.find((item) => item.id === id) ?? null;
}

export async function listTicketRequests() {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        select * from public.ticket_booking_requests
        order by created_at desc
      `;
      return rows.map((row) => fromRow(row));
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const requests = await readAll();
  return requests.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function updateTicketRequestStatus(id: string, status: TicketRequestStatus) {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const rows = await sql`
        update public.ticket_booking_requests
        set status = ${status}
        where id = ${id}
        returning *
      `;
      if (!rows[0]) throw new Error("Ticket request not found");
      return fromRow(rows[0]);
    } catch (error) {
      if (isMissingTableError(error)) {
        throw new Error("Ticket requests table is not set up. Run npm run db:setup.");
      }
      throw error;
    }
  }

  const requests = await readAll();
  const index = requests.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Ticket request not found");
  requests[index] = { ...requests[index], status };
  await writeAll(requests);
  return requests[index];
}

export function createTicketRequestId() {
  return randomUUID().slice(0, 8).toUpperCase();
}
