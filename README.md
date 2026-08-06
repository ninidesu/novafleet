# NovaFleet

Fleet monitoring and transportation management for microfinance field operations.

## Architecture

```
client/   React + Vite web app  ──HTTP/REST──►  server/  Node + Express API  ──►  Supabase (PostgreSQL, fleet schema)
                    │                                            ▲
                    └────────── Supabase Auth (login/session) ───┘
```

- **Web** (`client/`): React + Vite. All data is fetched from the REST API via `src/services/`. Supabase is used only for authentication (login + session); the session JWT is attached to every API request.
- **API** (`server/`): Node + Express. Owns all database access using the Supabase **service-role** key, verifies the caller's Supabase JWT, enforces roles, and returns ready-to-render view models.
- **Database** (`supabase/migrations/`): the full `fleet` schema plus `public.profiles`, RLS, and change auditing — reverse-engineered into versioned migrations.
- **Mobile** (`driver-app/mobile/`): React Native + Expo driver app (currently on mock data; not yet wired to the API).

## Routes (web)

`/login` · `/dashboard` · `/live-fleet` · `/vehicles` · `/drivers` · `/trips` · `/trips/new` · `/trips/:id` · `/route-risk-monitoring` · `/devices` · `/maintenance` · `/reports` · `/settings`

## API endpoints

All under `/api`, all (except `/api/health`) require a `Bearer <supabase-access-token>`:

| Resource | Endpoints |
| --- | --- |
| Profile | `GET/PATCH /me` |
| Vehicles | `GET /vehicles`, `GET /vehicles/drivers`, `POST/PATCH/DELETE` (admin) |
| Drivers | `GET /drivers`, `GET /drivers/assignable-vehicles`, `POST /drivers/:id/assign`, `POST/PATCH/DELETE` (admin) |
| Trips | `GET /trips`, `GET /trips/options`, `GET /trips/:id`, `POST /trips`, `PATCH /trips/:id`, `POST /trips/:id/{start,cancel,complete}`, `POST /trips/:id/sensor-readings` |
| Devices | `GET/POST/PATCH/DELETE /devices` (admin), `GET /devices/vehicles` |
| Maintenance | `GET/POST/PATCH/DELETE /maintenance` (admin), `GET /maintenance/vehicles` |
| Dashboard | `GET /dashboard` |
| Reports | `GET /reports` |
| Monitoring | `GET /monitoring/route-anomalies`, `GET /monitoring/risk-scores` |
| Notifications | `GET /notifications` |
| Settings | `GET /settings` |

## Run it locally

**1. Database** — apply the migrations in `supabase/migrations/` to your Supabase project (via the Supabase CLI `supabase db push`, or paste them into the SQL editor in filename order).

**2. API**

```bash
cd server
cp .env.example .env   # fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev            # http://localhost:4000
```

**3. Web**

```bash
cd client
cp .env.example .env.local   # fill in VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev                  # http://localhost:5173  (proxies /api → :4000)
```

Sign in with a Supabase Auth user that has a matching `public.profiles` row with `module = 'fleet'` and `role` of `admin` or `dispatcher`.

## Notes

- Real-time updates are handled by lightweight client polling (`pollingSubscription` in `src/services/api.js`), replacing the previous direct Supabase realtime subscriptions.
- The service-role key is server-side only and must never reach the browser. `server/.env` is gitignored.
