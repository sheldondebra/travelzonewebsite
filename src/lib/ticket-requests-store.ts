import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { TicketRequest, TicketRequestStatus } from "@/lib/ticket-requests";
import { isMissingTableError, isTicketRequestWriteFallbackError } from "@/lib/supabase/db-errors";

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

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function toRow(request: TicketRequest) {
  return {
    id: request.id,
    full_name: request.fullName,
    email: request.email,
    phone: request.phone,
    trip_type: request.tripType,
    origin: request.origin,
    destination: request.destination,
    departure_date: request.departureDate,
    return_date: request.returnDate ?? null,
    passengers: request.passengers,
    cabin_class: request.cabinClass,
    flexible_dates: request.flexibleDates,
    notes: request.notes ?? null,
    status: request.status,
    created_at: request.createdAt,
  };
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
  const supabase = supabaseClient();
  if (supabase) {
    const { error } = await supabase.from("ticket_booking_requests").insert(toRow(request));
    if (!error) return;

    if (isTicketRequestWriteFallbackError(error)) {
      await persistTicketRequestLocally(request);
      return;
    }

    throw new Error(error.message);
  }

  await persistTicketRequestLocally(request);
}

export async function getTicketRequestById(id: string) {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("ticket_booking_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(error.message);
    }
    return data ? fromRow(data) : null;
  }

  const requests = await readAll();
  return requests.find((item) => item.id === id) ?? null;
}

export async function listTicketRequests() {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("ticket_booking_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => fromRow(row));
  }

  const requests = await readAll();
  return requests.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function updateTicketRequestStatus(id: string, status: TicketRequestStatus) {
  const supabase = supabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("ticket_booking_requests")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      if (isMissingTableError(error)) {
        throw new Error(
          "Ticket requests table is not set up. Run npm run db:setup.",
        );
      }
      throw new Error(error.message);
    }
    return fromRow(data);
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
