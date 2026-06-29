-- Manual flight ticket booking requests (no airline API — staff handles offline)

create table if not exists public.ticket_booking_requests (
  id text primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  trip_type text not null check (trip_type in ('one-way', 'round-trip')),
  origin text not null,
  destination text not null,
  departure_date date not null,
  return_date date,
  passengers integer not null check (passengers > 0),
  cabin_class text not null default 'economy' check (
    cabin_class in ('economy', 'premium-economy', 'business', 'first')
  ),
  flexible_dates boolean not null default false,
  notes text,
  status text not null default 'pending' check (
    status in ('pending', 'quoted', 'booked', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

alter table public.ticket_booking_requests enable row level security;

create index if not exists ticket_booking_requests_created_at_idx
  on public.ticket_booking_requests (created_at desc);

create index if not exists ticket_booking_requests_status_idx
  on public.ticket_booking_requests (status);

create index if not exists ticket_booking_requests_departure_date_idx
  on public.ticket_booking_requests (departure_date);

drop policy if exists "Staff can read ticket booking requests" on public.ticket_booking_requests;
create policy "Staff can read ticket booking requests"
  on public.ticket_booking_requests for select to authenticated
  using (public.is_staff());

drop policy if exists "Admins can update ticket booking requests" on public.ticket_booking_requests;
create policy "Admins can update ticket booking requests"
  on public.ticket_booking_requests for update to authenticated
  using (public.staff_role() = 'admin')
  with check (public.staff_role() = 'admin');

drop policy if exists "Public can submit ticket requests" on public.ticket_booking_requests;
create policy "Public can submit ticket requests"
  on public.ticket_booking_requests for insert
  to anon, authenticated
  with check (true);
