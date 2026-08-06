# NovaFleet Deployment

How the pieces are containerized, built in CI, and deployed.

```
              ┌──────────── Vercel ─────────────┐
   browser ──▶│  Web (client, static Vite build) │
              └───────────────┬──────────────────┘
                              │ HTTPS (VITE_API_URL)
              ┌───────────────▼──────── Render ──────────────┐
   ESP32  ───▶│  API (server, Docker)  ──▶  Supabase (Postgres)│
   mobile ───▶│  ML worker (Docker, loops) ─▶                  │
              └────────────────────────────────────────────────┘
```

- **Web** → Vercel (static)
- **API** + **ML worker** → Render (Docker, from `render.yaml`)
- **Database + Auth** → Supabase (already hosted)
- **Mobile** → Expo Application Services (EAS) build/OTA

## Environment variables (who needs what)

| Var | Web (Vercel) | API (Render) | Worker (Render) |
|---|---|---|---|
| `VITE_API_URL` | ✅ `https://<api>.onrender.com/api` | | |
| `VITE_SUPABASE_URL` | ✅ | | |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ (public anon key) | | |
| `SUPABASE_URL` | | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | | ✅ (secret) | ✅ (secret) |
| `SUPABASE_SCHEMA` = `fleet` | | ✅ | ✅ |
| `INGEST_API_KEY` | | ✅ (secret) | |
| `CORS_ORIGIN` | | ✅ = your Vercel URL | |

**Never** put the service-role key or ingest key in the web app.

---

## Local — Docker Compose (whole stack, one command)

```bash
# fill in server/.env and ml-worker/.env, and a root .env (see .env.example)
docker compose up --build
```
- API → http://localhost:4000
- Web → http://localhost:8080
- Worker runs in the background, scoring trips on a loop.

## Deploy the API + ML worker — Render (Blueprint)

1. Push this repo to GitHub.
2. Render → **New → Blueprint** → pick the repo. It reads `render.yaml` and creates **novafleet-api** (web) + **novafleet-ml-worker**.
3. In each service's **Environment** tab, fill the `sync: false` secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INGEST_API_KEY` (API), and set `CORS_ORIGIN` to your Vercel URL.
4. Deploy. Health check: `https://<api>.onrender.com/api/health`.

## Deploy the Web — Vercel

1. Vercel → **New Project** → import the repo, set **Root Directory = `client`** (it detects Vite + `vercel.json`).
2. Add env vars: `VITE_API_URL` (= the Render API URL + `/api`), `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Deploy. Then go back to Render and set the API's `CORS_ORIGIN` to this Vercel URL.

## ESP32 (cellular)

Once the API is on Render, point the firmware at it (no more ngrok): in `firmware/esp32-tracker/include/config.h` set `API_HOST` to the Render host, `API_PORT 443`, `API_USE_SSL 1`, and flash the `cellular` build.

## Mobile — EAS

```bash
npm i -g eas-cli
cd driver-app/mobile
eas build --platform android      # or ios
eas update                        # OTA updates
```
Set `EXPO_PUBLIC_API_URL` (= Render API), `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` as EAS build secrets.

## CI (GitHub Actions)

`.github/workflows/ci.yml` runs on every push/PR: builds the web app, syntax-checks the API, and compile-checks the worker. Vercel and Render auto-deploy from GitHub on merge to `main`, so CI is the gate before deploy.

## Monitoring (optional, per the stack)

- **UptimeRobot** — add an HTTP monitor on `https://<api>.onrender.com/api/health` (keeps the free Render instance warm too).
- **Sentry** — add `@sentry/node` to the API and `@sentry/react` to the web app with a `SENTRY_DSN`; initialize at startup. (Not wired yet — add when you want crash reporting.)
