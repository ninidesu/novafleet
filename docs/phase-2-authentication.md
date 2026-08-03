# NovaFleet Phase 2: Authentication and web access

## Required Supabase dashboard action

Before testing, open **Project Settings (or Integrations) → Data API → Exposed schemas** and add `fleet`. SQL grants alone cannot make an unexposed schema reachable through the Data API.

Apply `supabase/migrations/202608010001_phase2_authenticated_access.sql` through the project migration workflow. It grants only authenticated users `SELECT` access to their own fleet profile and `fleet.vehicles`, with RLS policies enforcing the same boundary. It adds no anonymous access and no browser-side role updates.

Existing migrations already grant some vehicle and device write privileges to `authenticated`; they are not expanded by Phase 2 and remain governed by their existing RLS policies. Review those policies before enabling later CRUD phases.

## Development account preparation

1. Use an authorized Supabase administrative workflow to create or invite the Auth user.
2. Add the matching `public.profiles` row using the Auth user's UUID as `id`.
3. Set `module` to `fleet` and the approved `role` to `admin`, `administrator`, or `dispatcher`.
4. Confirm the account can read its own profile and is intended to access fleet records.
5. Sign in through NovaFleet and run the read-only vehicle connection check.

No password belongs in `public.profiles`; Supabase Auth owns password management. No service-role key belongs in the React application.

## Account status

No account-status column was found in the repository's profile queries or SQL. The app therefore handles authenticated accounts with missing, unreadable, or unsupported fleet profiles as account-setup/access failures. Add status handling only after its actual database column and business rules are defined.