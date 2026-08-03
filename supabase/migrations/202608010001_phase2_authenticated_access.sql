-- Phase 2: authenticated NovaFleet profile resolution and fleet connection check.
-- Run through the Supabase migration workflow after confirming that `fleet` is exposed in Data API settings.

begin;

-- Profiles are the source of application role assignment. No browser client may update roles.
-- This policy assumes the existing profile model: id, full_name, role, module, created_at.
grant select on table public.profiles to authenticated;
alter table public.profiles enable row level security;
drop policy if exists "NovaFleet users can read their own profile" on public.profiles;
create policy "NovaFleet users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()) and module = 'fleet');

-- Least privilege for the Phase 1 connection check. No anonymous access and no new write grants.
grant usage on schema fleet to authenticated;
grant select on table fleet.vehicles to authenticated;
alter table fleet.vehicles enable row level security;
drop policy if exists "NovaFleet members can read vehicles" on fleet.vehicles;
create policy "NovaFleet members can read vehicles"
on fleet.vehicles for select to authenticated
using (
  exists (
    select 1 from public.profiles profile
    where profile.id = (select auth.uid())
      and profile.module = 'fleet'
      and lower(profile.role) in ('admin', 'administrator', 'dispatcher')
  )
);

commit;