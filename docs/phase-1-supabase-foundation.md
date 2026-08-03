# NovaFleet Phase 1: Supabase Foundation

## Environment

Create `client/.env.local` from `client/.env.example` and provide:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`VITE_SUPABASE_ANON_KEY` remains a temporary compatibility fallback only. Do not add a service-role key to a Vite environment file.

## Database structure

All new foundation reads use `fleetDb`, which is `supabase.schema("fleet")`. Existing services retain the client default schema of `fleet` through the compatibility bridge in `src/services/supabase.js`.

## Dashboard setup to verify

1. Add `fleet` to the project API's exposed schemas.
2. Grant the browser role (`anon` for unauthenticated checks, or `authenticated` for signed-in app use) `USAGE` on schema `fleet` and `SELECT` on the required tables.
3. Enable Row Level Security deliberately and add a policy that allows the intended browser role to read `fleet.vehicles`.
4. If the connection check returns a schema or permission failure, complete the matching step above before Phase 2.

## Development connection check

`checkFleetConnection` in `src/services/connectionCheckService.js` performs a read-only, limited query through `listVehiclesForConnectionCheck`. It returns `success_with_records`, `success_empty`, or `failed`; failures include a normalized kind, message, code, details, and hint. It performs no writes.