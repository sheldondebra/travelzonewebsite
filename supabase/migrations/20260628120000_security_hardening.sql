-- Tighten newsletter inserts and staff role resolution

drop policy if exists "Anyone can subscribe" on public.newsletter_subscribers;

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
    case
      when not exists (select 1 from public.users u where u.id = auth.uid())
        and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'editor')
      then auth.jwt() -> 'app_metadata' ->> 'role'
      else ''
    end,
    ''
  );
$$;
