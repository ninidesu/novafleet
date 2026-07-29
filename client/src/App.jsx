import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
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
import { logout, restoreSession } from "./services/authService.js";
import { applyStoredAppearance } from "./preferences.js";

export default function App() {
  useEffect(() => { applyStoredAppearance(); }, []);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let active = true;

    restoreSession()
      .then((sessionUser) => {
        if (active) setUser(sessionUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoadingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  if (loadingSession) {
    return (
      <div className="auth-loading-screen" role="status" aria-live="polite">
        <span className="auth-loading-spinner" aria-hidden="true" />
        <strong>Restoring secure session</strong>
        <p>Connecting to your NovaFleet workspace.</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login onAuthenticated={setUser} />} />
      <Route element={<ProtectedRoute user={user} loading={loadingSession} />}>
        <Route element={<DashboardLayout user={user} onLogout={handleLogout} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-fleet" element={<LiveFleet />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/new" element={<CreateTrip />} />
          <Route path="/trips/:tripId/edit" element={<CreateTrip />} />
          <Route path="/trips/:tripId" element={<TripDetails />} />          <Route path="/route-risk-monitoring" element={<RouteRiskMonitoring />} />
          <Route path="/route-deviations" element={<Navigate to="/route-risk-monitoring" replace />} />
          <Route path="/risk-monitoring" element={<Navigate to="/route-risk-monitoring" replace />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

