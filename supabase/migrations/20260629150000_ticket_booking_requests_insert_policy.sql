-- Allow public ticket request submissions through the server (PostgREST insert)

drop policy if exists "Public can submit ticket requests" on public.ticket_booking_requests;
create policy "Public can submit ticket requests"
  on public.ticket_booking_requests for insert
  to anon, authenticated
  with check (true);
