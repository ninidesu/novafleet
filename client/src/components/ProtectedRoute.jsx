import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessRoute } from "../config/roles.js";

export default function ProtectedRoute({ user, loading }) {
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-screen" role="status" aria-live="polite">
        <span className="auth-loading-spinner" aria-hidden="true" />
        <strong>Restoring secure session</strong>
        <p>Connecting to your NovaFleet workspace.</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessRoute(user.role, location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}