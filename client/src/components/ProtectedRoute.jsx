import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { canAccessRoute } from "../config/roles.js";

export default function ProtectedRoute() {
  const { isLoading, isAuthenticated, role, profileState } = useAuth();
  const location = useLocation();
  if (isLoading || (isAuthenticated && profileState === "loading")) return <div className="auth-loading-screen" role="status" aria-live="polite"><span className="auth-loading-spinner" aria-hidden="true" /><strong>Restoring secure session</strong><p>Connecting to your NovaFleet workspace.</p></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (profileState !== "ready") return <Navigate to="/account-setup" replace />;
  if (!canAccessRoute(role, location.pathname)) return <Navigate to="/access-denied" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}