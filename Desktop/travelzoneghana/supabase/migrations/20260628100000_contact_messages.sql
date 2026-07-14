-- Contact form messages from /contact page

create table if not exists public.contact_messages (
  id text primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  subject text not null check (
    subject in ('tour', 'corporate', 'group', 'ticketing', 'other')
  ),
  message text not null,
  status text not null default 'pending' check (
    status in ('pending', 'read', 'archived')
  ),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status);

drop policy if exists "Staff can read contact messages" on public.contact_messages;
create policy "Staff can read contact messages"
  on public.contact_messages for select to authenticated
  using (public.is_staff());

drop policy if exists "Admins can update contact messages" on public.contact_messages;
create policy "Admins can update contact messages"
  on public.contact_messages for update to authenticated
  using (public.staff_role() = 'admin')
  with check (public.staff_role() = 'admin');
