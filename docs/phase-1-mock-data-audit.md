# NovaFleet Phase 1: Mock-data migration audit

No mock source was deleted or newly imported in Phase 1. Current web dashboard pages use Supabase services rather than imports from `client/src/data`; the two legacy web mock modules are presently unreferenced.

| Scope / file | Mock source | Data represented | Future replacement | Replace now? |
| --- | --- | --- | --- | --- |
| `client/src/data/mockVehicles.js` | Local module, no current importer | Vehicle positions and fleet status | `vehiclesService` plus `telemetryService` | No importer to migrate; retain until confirmed obsolete. |
| `client/src/data/mockTrips.js` | Local module, no current importer | Trip routes and trip state | `tripsService` plus `telemetryService` | No importer to migrate; retain until confirmed obsolete. |
| `client/src/hooks/useMockFleetUpdates.js` | Local hook, no current importer | Simulated moving-vehicle updates | `telemetryService` and Supabase Realtime | No importer to migrate; retain until live monitoring phase. |
| `driver-app/mobile/src/state/AppStateContext.jsx` | `driver-app/mobile/src/data/mockData.js` | Driver profile | Driver-app profile service | Yes, but it is a later mobile-app phase. |
| `driver-app/mobile/src/screens/AssignmentsScreen.jsx`, `HomeScreen.jsx`, `TripDetailsScreen.jsx` | `driver-app/mobile/src/data/mockData.js` | Assigned and next trips | Driver-app trips service | Yes, later phase. |
| `driver-app/mobile/src/screens/HistoryScreen.jsx`, `FuelScreen.jsx` | `driver-app/mobile/src/data/mockData.js` | Trip history and fuel records | Driver-app trips/fuel services | Yes, later phase. |
| `driver-app/mobile/src/screens/IncidentScreen.jsx`, `NotificationsScreen.jsx` | `driver-app/mobile/src/data/mockData.js` | Incident types and notifications | Driver-app alerts service | Yes, later phase. |
| `driver-app/mobile/src/screens/SetupScreen.jsx`, `TrackingMethodScreen.jsx` | `driver-app/mobile/src/data/mockData.js` | Driver setup and tracking reasons | Driver-app profile/device services | Yes, later phase. |
| `server/data.js` via `server/index.js` | Standalone Express demo data | Unrelated employee/admin demo records | Remove or replace only after server scope is agreed | Yes, but unrelated to the React fleet client and unsafe to alter now. |