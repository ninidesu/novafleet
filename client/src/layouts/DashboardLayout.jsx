import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";
import { getRoleLabel } from "../config/roles.js";

const FALLBACK_USER = {
  name: "Alex Rivera",
  role: "admin",
  roleLabel: getRoleLabel("admin"),
  initials: "AR",
};

export default function DashboardLayout({ user = FALLBACK_USER, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const sessionUser = user || FALLBACK_USER;

  return (
    <div className="app-layout">
      <a className="skip-link" href="#page-content">Skip to main content</a>
      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={sessionUser} onLogout={onLogout} />
      <main className="layout-main">
        <Topbar user={sessionUser} onMenu={() => setSidebarOpen(true)} searchQuery={globalSearch} onSearchChange={setGlobalSearch} />
        <div className="page-shell app-scroll" id="page-content" tabIndex="-1">
          <Outlet context={{ globalSearch }} />
        </div>
      </main>
    </div>
  );
}
