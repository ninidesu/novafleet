import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import InlineError from "./InlineError.jsx";
import { getFleetNotifications, subscribeToFleetNotifications } from "../services/notificationService.js";

const READ_KEY = "novafleet-read-notifications";
const POPOVER_ID = "fleet-notifications-popover";

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
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const loadingRef = useRef(false);
  const markingAllRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(storedReadIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const unreadCount = useMemo(() => notifications.filter((item) => !readIds.has(item.id)).length, [notifications, readIds]);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try { setNotifications(await getFleetNotifications()); setError(""); }
    catch (loadError) { setError(loadError.message || "Notifications unavailable."); }
    finally { loadingRef.current = false; setLoading(false); }
  }, []);

  useEffect(() => { load(); return subscribeToFleetNotifications(load); }, [load]);

  const closeMenu = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) closeMenu();
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") { event.preventDefault(); closeMenu(); }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open) return;
    const focusTarget = popoverRef.current?.querySelector("[data-notification-primary], [data-mark-all]") || popoverRef.current;
    requestAnimationFrame(() => focusTarget?.focus());
  }, [open]);

  const saveReadIds = (next) => {
    setReadIds(next);
    localStorage.setItem(READ_KEY, JSON.stringify([...next]));
  };
  const markRead = (id) => saveReadIds(new Set([...readIds, id]));
  const markAllRead = () => {
    if (!unreadCount || markingAllRef.current) return;
    markingAllRef.current = true;
    setMarkingAll(true);
    saveReadIds(new Set([...readIds, ...notifications.map((item) => item.id)]));
    requestAnimationFrame(() => { markingAllRef.current = false; setMarkingAll(false); });
  };
  const openNotification = (item) => {
    markRead(item.id);
    closeMenu(false);
    navigate("/live-fleet");
  };
  const toggleMenu = () => { if (open) closeMenu(false); else setOpen(true); };

  return <div className="notification-menu" ref={rootRef}>
    <button ref={triggerRef} className={`topbar-icon-button ${open ? "active" : ""}`} type="button" aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"} aria-expanded={open} aria-controls={POPOVER_ID} aria-haspopup="dialog" onClick={toggleMenu}>
      <BellIcon/>{unreadCount > 0 && <span className="topbar-alert-dot" aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>
    {open && <section ref={popoverRef} id={POPOVER_ID} className="notification-popover" role="dialog" aria-modal="false" aria-labelledby={`${POPOVER_ID}-title`} tabIndex="-1">
      <header><div><strong id={`${POPOVER_ID}-title`}>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : "You are all caught up"}</span></div>{unreadCount > 0 && <button type="button" data-mark-all onClick={markAllRead} disabled={markingAll}>{markingAll ? "Marking read..." : "Mark all read"}</button>}</header>
      <div className="notification-list app-scroll" aria-live="polite" aria-busy={loading}>
        {loading ? <div className="notification-state" role="status">Loading notifications...</div> : error ? <InlineError variant="compact" title="Unable to load notifications" message="Please try again." onRetry={load} retrying={loading} /> : notifications.length ? <ul className="notification-items">{notifications.map((item) => {
          const isRead = readIds.has(item.id);
          return <li className={`notification-entry ${isRead ? "read" : "unread"}`} key={item.id}>
            <button type="button" className="notification-item" data-notification-primary onClick={() => openNotification(item)} aria-label={`${item.title}, ${item.vehicle}, ${relativeTime(item.timestamp)}${isRead ? ", read" : ", unread"}`}>
              <i aria-hidden="true"/><div><strong>{item.title}</strong><span>{item.vehicle} - {relativeTime(item.timestamp)}</span><small>{isRead ? "Read" : item.acknowledged ? "Incident acknowledged - Unread" : "Requires review - Unread"}</small></div>
            </button>
            {!isRead && <button type="button" className="notification-mark-read" onClick={() => markRead(item.id)} aria-label={`Mark ${item.title} for ${item.vehicle} as read`}>Mark read</button>}
          </li>;
        })}</ul> : <div className="notification-state" role="status"><strong>No notifications</strong><span>You are all caught up.</span></div>}
      </div>
      <footer><button type="button" onClick={() => { closeMenu(false); navigate("/risk-monitoring"); }}>Open risk monitoring</button></footer>
    </section>}
  </div>;
}