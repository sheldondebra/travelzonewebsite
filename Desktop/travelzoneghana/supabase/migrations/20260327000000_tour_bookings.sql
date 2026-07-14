-- Run this in Supabase SQL Editor to enable production booking storage.
-- Then set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

create table if not exists public.tour_bookings (
  id text primary key,
  tour_slug text not null,
  tour_title text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  travel_date date not null,
  travelers integer not null check (travelers > 0),
  special_requests text,
  estimated_total numeric(10, 2) not null,
  currency text not null default 'GHS',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('unpaid', 'pending', 'paid', 'failed')),
  paystack_reference text unique,
  paid_amount numeric(10, 2),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tour_bookings enable row level security;

-- No public read/write policies — bookings are inserted server-side via service role only.

create index if not exists tour_bookings_created_at_idx on public.tour_bookings (created_at desc);
create index if not exists tour_bookings_status_idx on public.tour_bookings (status);
