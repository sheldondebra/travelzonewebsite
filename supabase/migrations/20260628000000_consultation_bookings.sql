-- Consultation bookings for free travel consultations (office or phone)

create table if not exists public.consultation_bookings (
  id text primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  preferred_date date not null,
  preferred_time text not null check (
    preferred_time in ('09:00', '10:30', '12:00', '14:00', '15:30')
  ),
  topic text not null check (
    topic in (
      'tour-package',
      'airline-ticketing',
      'group-travel',
      'corporate',
      'insurance-hotels',
      'other'
    )
  ),
  mode text not null check (mode in ('in-office', 'phone')),
  notes text,
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  created_at timestamptz not null default now()
);

alter table public.consultation_bookings enable row level security;

create index if not exists consultation_bookings_created_at_idx
  on public.consultation_bookings (created_at desc);

create index if not exists consultation_bookings_status_idx
  on public.consultation_bookings (status);

create index if not exists consultation_bookings_preferred_date_idx
  on public.consultation_bookings (preferred_date);

drop policy if exists "Staff can read consultation bookings" on public.consultation_bookings;
create policy "Staff can read consultation bookings"
  on public.consultation_bookings for select to authenticated
  using (public.is_staff());

drop policy if exists "Admins can update consultation bookings" on public.consultation_bookings;
create policy "Admins can update consultation bookings"
  on public.consultation_bookings for update to authenticated
  using (public.staff_role() = 'admin')
  with check (public.staff_role() = 'admin');
