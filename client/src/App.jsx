import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Drivers from "./pages/Drivers.jsx";
import LiveFleet from "./pages/LiveFleet.jsx";
import Login from "./pages/Login.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import NotFound from "./pages/NotFound.jsx";
import Reports from "./pages/Reports.jsx";
import RouteRiskMonitoring from "./pages/RouteRiskMonitoring.jsx";
import Settings from "./pages/Settings.jsx";
import Trips from "./pages/Trips.jsx";
import CreateTrip from "./pages/CreateTrip.jsx";
import TripDetails from "./pages/TripDetails.jsx";
import Vehicles from "./pages/Vehicles.jsx";
import Devices from "./pages/Devices.jsx";
import AccessDenied from "./pages/AccessDenied.jsx";
import AccountSetup from "./pages/AccountSetup.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { applyStoredAppearance } from "./preferences.js";

export default function App() {
  const { applicationUser, isAuthenticated, profileState, signOut } = useAuth();
  useEffect(() => { applyStoredAppearance(); }, []);
  const defaultDestination = profileState === "ready" ? "/dashboard" : "/account-setup";

  return <Routes>
    <Route path="/" element={<Navigate to={isAuthenticated ? defaultDestination : "/login"} replace />} />
    <Route path="/login" element={isAuthenticated ? <Navigate to={defaultDestination} replace /> : <Login />} />
    <Route path="/account-setup" element={!isAuthenticated ? <Navigate to="/login" replace /> : profileState === "ready" ? <Navigate to="/dashboard" replace /> : <AccountSetup />} />
    <Route path="/access-denied" element={!isAuthenticated ? <Navigate to="/login" replace /> : <AccessDenied />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardLayout user={applicationUser} onLogout={signOut} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/live-fleet" element={<LiveFleet />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/new" element={<CreateTrip />} />
        <Route path="/trips/:tripId/edit" element={<CreateTrip />} />
        <Route path="/trips/:tripId" element={<TripDetails />} />
        <Route path="/route-risk-monitoring" element={<RouteRiskMonitoring />} />
        <Route path="/route-deviations" element={<Navigate to="/route-risk-monitoring" replace />} />
        <Route path="/risk-monitoring" element={<Navigate to="/route-risk-monitoring" replace />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>;
}