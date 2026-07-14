-- Staff users profile table (mirrors auth.users for admin dashboard)

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'editor')),
  display_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_idx on public.users (lower(email));
create index if not exists users_role_idx on public.users (role);

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;

drop policy if exists "Admins can read all users" on public.users;
create policy "Admins can read all users"
  on public.users for select to authenticated
  using (public.staff_role() = 'admin');

drop policy if exists "Staff can read own user row" on public.users;
create policy "Staff can read own user row"
  on public.users for select to authenticated
  using (id = auth.uid());

drop policy if exists "Admins can insert users" on public.users;
create policy "Admins can insert users"
  on public.users for insert to authenticated
  with check (public.staff_role() = 'admin');

drop policy if exists "Admins can update users" on public.users;
create policy "Admins can update users"
  on public.users for update to authenticated
  using (public.staff_role() = 'admin')
  with check (public.staff_role() = 'admin');

drop policy if exists "Admins can delete users" on public.users;
create policy "Admins can delete users"
  on public.users for delete to authenticated
  using (public.staff_role() = 'admin');

create or replace function public.staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select u.role
      from public.users u
      where u.id = auth.uid()
        and u.is_active = true
    ),
    auth.jwt() -> 'app_metadata' ->> 'role',
    ''
  );
$$;

-- Backfill existing auth staff into public.users
insert into public.users (id, email, role)
select
  u.id,
  lower(u.email),
  u.raw_app_meta_data ->> 'role'
from auth.users u
where coalesce(u.raw_app_meta_data ->> 'role', '') in ('admin', 'editor')
on conflict (id) do update set
  email = excluded.email,
  role = excluded.role,
  is_active = true,
  updated_at = now();
