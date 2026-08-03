# NovaFleet Frontend Phase 1.1 Audit

## A. Architecture

- Entry: `client/src/main.jsx`; React StrictMode, BrowserRouter, AuthProvider.
- App/routes: `src/App.jsx`; public login/account-state routes and protected authenticated layout routes.
- Auth: `src/context/AuthContext.jsx`, `src/services/authService.js`, `src/components/ProtectedRoute.jsx`.
- Layout/navigation: `layouts/DashboardLayout.jsx`, `components/Sidebar.jsx`, `components/Topbar.jsx`.
- Styling: shared `src/styles.css`, tokens in `theme.js`; component-specific classes are centralized in the stylesheet.
- Services/hooks: feature services in `src/services`, common hooks in `src/hooks`.

## B. Route audit

| Route | Component | Role | Status | Existing functionality | Missing frontend work | Later phase |
|---|---|---|---|---|---|---|
| /login | Login | Public | Functional but needs refinement | Supabase sign-in UI, loading/error | Accessibility and final auth UX review | 2 |
| /dashboard | Dashboard | Admin, Dispatcher | Partial | Metrics/map shell/loading | Data-state and dashboard UX completion | 8 |
| /live-fleet | LiveFleet | Admin, Dispatcher | Partial | Map/list/filter UI | Live-monitoring UX | 5 |
| /vehicles | Vehicles | Admin, Dispatcher | Functional but needs refinement | Table, modal, search, loading/error | Shared filters/feedback/action permissions | 3 |
| /drivers | Drivers | Admin, Dispatcher | Functional but needs refinement | Table, modal, search, loading/error | Shared filters/feedback/action permissions | 3 |
| /trips/* | Trips/CreateTrip/TripDetails | Admin, Dispatcher | Partial | Dispatch forms and detail UI | Workflow completion | 4 |
| /route-risk-monitoring | RouteRiskMonitoring | Admin, Dispatcher | Partial | Tabular risk/deviation view | Monitoring UX | 6 |
| /devices | Devices | Admin | Partial | Device table/modal | Device module UX | 7 |
| /maintenance | Maintenance | Admin | Partial | Maintenance table/modal | Maintenance UX | 7 |
| /reports | Reports | Admin, Dispatcher | Partial | Report tabs/tables | Reports UX | 8 |
| /settings | Settings | Admin, Dispatcher | Functional but needs refinement | Account/display settings | UI consistency | 2 |
| /account-setup, /access-denied | AccountSetup/AccessDenied | Authenticated | Functional but needs refinement | Account state feedback | Shared error-page polish | 2 |
| * | NotFound | Public | Complete | Recovery navigation | None | N/A |

## C. Shared component audit

- Reuse: `PageHeader`, `Button`, `Input`, `Select`, `StatusBadge`, `LoadingState`, `EmptyState`, `DataTable`, `TablePagination`, `Card`.
- Duplicate/modal pattern: driver, vehicle, device and maintenance modals implement similar dialog, form-error and action markup; consolidate later.
- Missing shared patterns: toast feedback, reusable confirmation dialog, filter bar, generalized error-state component, button loading/icon API.
- `TablePage` provides a useful table/search foundation, but filters are module-specific or absent.

## D. Role audit

Administrator sees all configured routes. Dispatcher navigation excludes Devices and Maintenance. `ProtectedRoute` checks centralized route permissions. Current pages need a later action-level permission pass; UI visibility is not database authorization. Unknown roles receive no permitted routes.

## E. Responsive issues

Sidebar has mobile overlay behavior. Tables rely on horizontal table handling and need narrow-width review. Dense one-line modal/page implementations make wrapping and action-row behavior fragile. Page header/actions and filter rows should be standardized in Phase 1.2–1.4.

## F. Accessibility issues

### High
- Repeated modal implementations lack a shared focus-trap/restore-focus behavior.

### Medium
- Several status meanings rely substantially on color; shared badges need text/icon reinforcement.
- Confirmation uses browser `window.confirm` in feature pages rather than a consistent accessible dialog.

### Low
- Some icon controls use labels correctly, but a systematic icon-only audit is still needed.

## G. Dead/duplicate code

- `src/data/mockVehicles.js`, `mockTrips.js`, and `useMockFleetUpdates.js`: confirmed unreferenced web-client legacy files; retain until later-module migration decisions.
- `src/services/*Service.js` singular/plural pairs: possibly overlapping Phase 1 foundations and active feature services; consolidate only after ownership is decided.
- Mobile driver-app mocks are separate later-scope artifacts.

## H. Immediate frontend risks

1. Action-level permissions are inconsistent across feature modals.
2. No shared toast/confirmation component.
3. Large feature components are densely one-lined, raising maintenance and responsive risk.
4. Table filtering is not standardized.
5. Shared modal keyboard/focus behavior is inconsistent.
