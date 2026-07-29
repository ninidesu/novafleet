import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import useFleetResource from "../hooks/useFleetResource.js";
import { APPEARANCE_KEY, DEFAULT_APPEARANCE, DEFAULT_NOTIFICATIONS, NOTIFICATION_PREFS_KEY, loadPreference, saveAppearance } from "../preferences.js";
import { getSession } from "../services/authService.js";
import { getSettingsWorkspace } from "../services/settingsService.js";

const TABS = [
  { id: "account", label: "Account" },
  { id: "users", label: "Users & RBAC", adminOnly: true },
  { id: "audit", label: "Audit Logs", adminOnly: true },
  { id: "alerts", label: "Alerts & Notifications" },
  { id: "display", label: "Appearance" },
];
const userColumns = [{ key: "name", header: "User" }, { key: "role", header: "Role", render: (row) => <StatusBadge status={row.role} /> }, { key: "module", header: "Module Access" }, { key: "createdAt", header: "Created" }];
const auditColumns = [{ key: "timestamp", header: "Date & Time" }, { key: "actor", header: "Changed By" }, { key: "action", header: "Change" }, { key: "resource", header: "Record" }, { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> }];

function ToggleRow({ title, description, checked, onChange }) {
  return <label className="settings-toggle-row"><div><strong>{title}</strong><span>{description}</span></div><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const [appearance, setAppearance] = useState(() => loadPreference(APPEARANCE_KEY, DEFAULT_APPEARANCE));
  const [notifications, setNotifications] = useState(() => loadPreference(NOTIFICATION_PREFS_KEY, DEFAULT_NOTIFICATIONS));
  const session = getSession();
  const role = session?.role || "dispatcher";
  const isAdmin = role === "admin";
  const visibleTabs = useMemo(() => TABS.filter((tab) => !tab.adminOnly || isAdmin), [isAdmin]);
  const loader = useCallback(() => getSettingsWorkspace({ includeUsers: isAdmin, includeAudit: isAdmin }), [isAdmin]);
  const { data, loading, error, reload } = useFleetResource(loader);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) setActiveTab("account");
  }, [activeTab, visibleTabs]);

  const updateAppearance = (name, value) => { const next = { ...appearance, [name]: value }; setAppearance(next); saveAppearance(next); };
  const updateNotification = (name, value) => { const next = { ...notifications, [name]: value }; setNotifications(next); localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next)); };

  return <div className="settings-page">
    <PageHeader eyebrow="System" title="Settings" />
    <div className="settings-layout">
      <nav className="settings-nav card" aria-label="Settings sections">{visibleTabs.map((tab) => <button type="button" className={activeTab === tab.id ? "active" : ""} key={tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</nav>
      <section className="settings-content">
        {loading ? <LoadingState title="Loading settings" description="Retrieving account and administrative records." /> : error ? <Card><EmptyState title="Settings are unavailable" description={error} /><div className="resource-error"><Button onClick={reload}>Try again</Button></div></Card> : <>
          {activeTab === "account" && <div className="settings-profile-grid"><Card title="Account"><div className="profile-auth-list"><div><span>Full name</span><strong>{data.profile.full_name || "Not recorded"}</strong></div><div><span>Email</span><strong>{data.profile.email}</strong></div><div><span>Account ID</span><strong title={data.profile.id}>{data.profile.id.slice(0, 8)}</strong></div><div><span>Created</span><strong>{data.profile.created_at ? new Date(data.profile.created_at).toLocaleDateString() : "Not recorded"}</strong></div></div></Card><Card title="Authorization"><div className="profile-auth-list"><div><span>Role</span><StatusBadge status={data.profile.role === "admin" ? "Administrator" : "Dispatcher"} /></div><div><span>Module</span><strong>{data.profile.module}</strong></div><div><span>Identity source</span><strong>Supabase Auth</strong></div><div><span>Access model</span><strong>Role-based access</strong></div></div></Card></div>}
          {isAdmin && activeTab === "users" && <Card title="Users & Role-Based Access Control"><div className="settings-section-intro"><p>Users and assigned application roles from the profiles table.</p><span>{data.users.length} users</span></div><DataTable columns={userColumns} rows={data.users} emptyTitle="No user profiles" emptyDescription="Authenticated profiles will appear here." /><div className="rbac-summary"><div><strong>Administrator</strong><span>Full fleet, monitoring, management, reports, and system settings access.</span></div><div><strong>Dispatcher</strong><span>Daily fleet operations, trips, drivers, live monitoring, and reports access.</span></div></div></Card>}
          {activeTab === "audit" && <Card title="Audit Logs"><div className="settings-section-intro"><p>A permanent history of created, updated, and deleted records across NovaFleet.</p><span>{data.activities.length} events</span></div><DataTable columns={auditColumns} rows={data.activities} emptyTitle="No operational activity" emptyDescription="Changes made after audit tracking is enabled will appear here with their date and time." /></Card>}
          {activeTab === "alerts" && <Card title="Alerts & Notifications"><div className="settings-control-list"><ToggleRow title="Incident alerts" description="Show realtime safety and driving incident notifications." checked={notifications.incidentAlerts} onChange={(value) => updateNotification("incidentAlerts", value)} /><ToggleRow title="Route deviations" description="Notify when a vehicle leaves its planned route." checked={notifications.routeDeviations} onChange={(value) => updateNotification("routeDeviations", value)} /><ToggleRow title="Maintenance reminders" description="Show reminders for scheduled and overdue maintenance." checked={notifications.maintenanceReminders} onChange={(value) => updateNotification("maintenanceReminders", value)} /><ToggleRow title="Notification sound" description="Play a sound when a new live notification arrives." checked={notifications.browserSound} onChange={(value) => updateNotification("browserSound", value)} /></div></Card>}
          {activeTab === "display" && <Card title="Appearance"><div className="display-control-group"><div><strong>Dark/Light Mode</strong><span>Choose the interface appearance for this browser.</span></div><div className="segmented-control" role="group" aria-label="Color mode">{["light", "dark"].map((value) => <button type="button" className={appearance.theme === value ? "active" : ""} key={value} onClick={() => updateAppearance("theme", value)}>{value === "light" ? "Light mode" : "Dark mode"}</button>)}</div></div><div className="display-control-group"><div><strong>Text Size</strong><span>Adjust interface text for readability.</span></div><div className="segmented-control" role="group" aria-label="Text size">{[{ id: "compact", label: "Compact" }, { id: "default", label: "Default" }, { id: "large", label: "Large" }].map((option) => <button type="button" className={appearance.textSize === option.id ? "active" : ""} key={option.id} onClick={() => updateAppearance("textSize", option.id)}>{option.label}</button>)}</div></div><div className="display-preview"><span>Preview</span><strong>NovaFleet operations dashboard</strong><p>Vehicle status, routes, alerts, and fleet records remain clear and readable.</p></div></Card>}
        </>}
      </section>
    </div>
  </div>;
}