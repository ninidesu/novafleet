import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFleetNotifications, subscribeToFleetNotifications } from "../services/notificationService.js";

const READ_KEY = "novafleet-read-notifications";
function BellIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>}
function relativeTime(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return new Date(value).toLocaleDateString();
}
function storedReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")); } catch { return new Set(); }
}

export default function NotificationMenu() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(storedReadIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setNotifications(await getFleetNotifications()); setError(""); }
    catch (loadError) { setError(loadError.message || "Notifications unavailable."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); return subscribeToFleetNotifications(load); }, [load]);
  useEffect(() => {
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !readIds.has(item.id)).length, [notifications, readIds]);
  const saveReadIds = (next) => { setReadIds(next); localStorage.setItem(READ_KEY, JSON.stringify([...next])); };
  const markAllRead = () => saveReadIds(new Set([...readIds, ...notifications.map((item) => item.id)]));
  const openNotification = (item) => { saveReadIds(new Set([...readIds, item.id])); setOpen(false); navigate("/live-fleet"); };

  return <div className="notification-menu" ref={rootRef}>
    <button className={`topbar-icon-button ${open ? "active" : ""}`} type="button" aria-label={`Notifications, ${unreadCount} unread`} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((value) => !value)}>
      <BellIcon/>{unreadCount > 0 && <span className="topbar-alert-dot">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>
    {open && <section className="notification-popover" role="dialog" aria-label="Fleet notifications">
      <header><div><strong>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : "You are all caught up"}</span></div>{unreadCount > 0 && <button type="button" onClick={markAllRead}>Mark all read</button>}</header>
      <div className="notification-list app-scroll" aria-live="polite">
        {loading ? <div className="notification-state">Loading notifications…</div> : error ? <div className="notification-state error">{error}<button type="button" onClick={load}>Try again</button></div> : notifications.length ? notifications.map((item) => <button type="button" className={`notification-item ${readIds.has(item.id) ? "read" : "unread"}`} key={item.id} onClick={() => openNotification(item)}><i aria-hidden="true"/><div><strong>{item.title}</strong><span>{item.vehicle} · {relativeTime(item.timestamp)}</span><small>{item.acknowledged ? "Incident acknowledged" : "Requires review"}</small></div></button>) : <div className="notification-state">No incident notifications yet.</div>}
      </div>
      <footer><button type="button" onClick={() => { setOpen(false); navigate("/risk-monitoring"); }}>Open risk monitoring</button></footer>
    </section>}
  </div>;
}
