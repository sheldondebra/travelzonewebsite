-- Allow configurable consultation time slots (HH:MM) instead of a fixed enum.

alter table public.consultation_bookings
  drop constraint if exists consultation_bookings_preferred_time_check;

alter table public.consultation_bookings
  add constraint consultation_bookings_preferred_time_check
  check (preferred_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
