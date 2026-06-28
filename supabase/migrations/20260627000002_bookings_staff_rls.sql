-- Staff access to existing tour_bookings table

create policy "Staff can read bookings"
  on public.tour_bookings for select
  to authenticated
  using (public.is_staff());

create policy "Admins can update bookings"
  on public.tour_bookings for update
  to authenticated
  using (public.staff_role() = 'admin')
  with check (public.staff_role() = 'admin');
