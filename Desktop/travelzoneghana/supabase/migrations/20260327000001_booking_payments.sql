-- Add payment columns to tour_bookings (run if table already exists)

alter table public.tour_bookings
  add column if not exists currency text not null default 'GHS',
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed')),
  add column if not exists paystack_reference text,
  add column if not exists paid_amount numeric(10, 2),
  add column if not exists paid_at timestamptz;

create unique index if not exists tour_bookings_paystack_reference_idx
  on public.tour_bookings (paystack_reference)
  where paystack_reference is not null;
