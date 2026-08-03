import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

export default function DashboardLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const closeOnDesktop = () => { if (window.innerWidth > 900) closeSidebar(); };
    const closeOnEscape = (event) => { if (event.key === "Escape") closeSidebar(); };
    window.addEventListener("resize", closeOnDesktop);
    window.addEventListener("keydown", closeOnEscape);
    return () => { window.removeEventListener("resize", closeOnDesktop); window.removeEventListener("keydown", closeOnEscape); };
  }, []);

  return <div className="app-layout">
    <a className="skip-link" href="#page-content">Skip to main content</a>
    {sidebarOpen && <button className="sidebar-backdrop" type="button" onClick={closeSidebar} aria-label="Close navigation" />}
    <Sidebar open={sidebarOpen} onClose={closeSidebar} user={user} onLogout={onLogout} />
    <main className="layout-main">
      <Topbar user={user} onMenu={() => setSidebarOpen(true)} searchQuery={globalSearch} onSearchChange={setGlobalSearch} />
      <div className="page-shell app-scroll" id="page-content" tabIndex="-1"><Outlet context={{ globalSearch }} /></div>
    </main>
  </div>;
}