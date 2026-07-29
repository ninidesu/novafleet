import { useState } from "react";
import { NavLink } from "react-router-dom";
import { getNavigationForRole } from "../config/roles.js";
import novaFleetLogo from "../assets/novafleet-logo.png";
import SignOutConfirmation from "./SignOutConfirmation.jsx";

const iconPaths = {
  OV: ["M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"],
  LF: ["M3 17h18", "M5 17V9l7-5 7 5v8", "M9 17v-5h6v5"],
  VH: ["M5 16h14l-1.5-6h-11z", "M7 10l1-3h8l1 3", "M7 16v2M17 16v2", "M8 13h.01M16 13h.01"],
  DR: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 21a8 8 0 0 1 16 0"],
  TR: ["M5 19V8", "M5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M19 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M8 5h4a7 7 0 0 1 7 7v4"],
  RD: ["M4 19 9 5l6 14 5-11", "M3 19h18"],
  RM: ["M3 12h4l2-5 4 10 2-5h6", "M5 4h14"],
  IO: ["M8 8h8v8H8z", "M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"],
  MT: ["M14 6a4 4 0 0 0-5 5L3 17l4 4 6-6a4 4 0 0 0 5-5l-3 3-3-3z"],
  RP: ["M5 3h14v18H5z", "M9 15v2M12 11v6M15 8v9"],
  ST: ["M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z", "M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7z"],
};

function NavIcon({ name }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      {(iconPaths[name] || iconPaths.OV).map((path) => <path d={path} key={path} />)}
    </svg>
  );
}

function SignOutIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>;
}

export default function Sidebar({ open, onClose, user, onLogout }) {
  const navigationGroups = getNavigationForRole(user.role);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  return (
    <>
    <aside className={`sidebar app-scroll ${open ? "open" : ""}`} aria-label="Primary navigation">
      <div className="sidebar-brand">
        <img className="sidebar-mark" src={novaFleetLogo} alt="" />
        <div className="sidebar-brand-copy">
          <div className="sidebar-name">NovaFleet</div>
          <span>Fleet operations</span>
        </div>
      </div>
      <div className="sidebar-rule" />
      <nav className="sidebar-nav">
        {navigationGroups.map((group) => (
          <section className="nav-group" key={group.label} aria-labelledby={`nav-${group.label.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="nav-section" id={`nav-${group.label.replace(/\s+/g, "-").toLowerCase()}`}>{group.label}</div>
            {group.items.map((item) => (
              <NavLink key={item.path} to={item.path} className="nav-link" onClick={onClose}>
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
                <span className="nav-active-mark" aria-hidden="true" />
              </NavLink>
            ))}
          </section>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-session"><span aria-hidden="true" />{user.roleLabel} workspace</div>
        <button className="logout-button" type="button" onClick={() => setConfirmingSignOut(true)}>
          <SignOutIcon />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
    {confirmingSignOut && <SignOutConfirmation onCancel={() => setConfirmingSignOut(false)} onConfirm={onLogout} />}
    </>
  );
}