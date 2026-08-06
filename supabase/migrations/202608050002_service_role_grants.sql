-- Grant the API's service_role access to the fleet schema.
-- Custom schemas do NOT automatically expose privileges to Supabase's built-in
-- roles, so without this the REST API (which authenticates as service_role and
-- bypasses RLS) still gets "permission denied for schema fleet". Idempotent.

begin;

grant usage on schema fleet to service_role;
grant all privileges on all tables in schema fleet to service_role;
grant all privileges on all sequences in schema fleet to service_role;

-- Ensure future fleet tables/sequences are also accessible to service_role.
alter default privileges in schema fleet grant all on tables to service_role;
alter default privileges in schema fleet grant all on sequences to service_role;

commit;
