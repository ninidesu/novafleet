# NovaFleet

Fleet monitoring and transportation management for microfinance field operations.

## Frontend

- React + Vite
- React Router routes
- Centralized mock data for starter screens
- Reusable dashboard layout, sidebar, topbar, cards, tables, badges, and form controls

## Starter Routes

- `/login`
- `/dashboard`
- `/live-fleet`
- `/vehicles`
- `/drivers`
- `/trips`
- `/route-deviations`
- `/risk-monitoring`
- `/devices`
- `/maintenance`
- `/reports`
- `/settings`

## Run It

```bash
cd client
npm install
npm run dev
```

Open the local Vite URL shown in the terminal and sign in with any non-empty email and password. Authentication is a temporary frontend-only mock while the real backend is not connected.

## Notes

The current pages use mock records from `src/data/mockData.js`. The service layer in `src/services/` is ready to use `import.meta.env.VITE_API_URL` when backend endpoints are available.
