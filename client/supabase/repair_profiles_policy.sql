-- NovaFleet RLS recursion repair
-- Run this once in Supabase SQL Editor.

begin;

create or replace function public.is_novafleet_administrator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and lower(role) in ('admin', 'administrator')
  );
$$;

revoke all on function public.is_novafleet_administrator() from public;
grant execute on function public.is_novafleet_administrator() to authenticated;

drop policy if exists "Administrators can view all profiles" on public.profiles;
create policy "Administrators can view all profiles"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select public.is_novafleet_administrator())
);

drop policy if exists "Administrators can view audit logs" on fleet.audit_logs;
create policy "Administrators can view audit logs"
on fleet.audit_logs
for select
to authenticated
using ((select public.is_novafleet_administrator()));

commit;
