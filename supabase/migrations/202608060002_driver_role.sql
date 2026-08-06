-- Allow the 'driver' role on public.profiles (for the mobile driver app).
-- profiles pre-existed and may carry a role check constraint under an unknown
-- name, so drop whatever role check exists, then add one that permits 'driver'.

begin;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%';
  if constraint_name is not null then
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end if;
end
$$;

alter table public.profiles
  add constraint profiles_role_check
  check (lower(role) in ('admin', 'administrator', 'dispatcher', 'driver'));

commit;
