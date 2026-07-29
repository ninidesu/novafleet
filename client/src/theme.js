export const ACCENT = "#2E6BE6";
export const APP_DESCRIPTION = "Fleet monitoring and transportation management for microfinance field operations.";

export const SECTION_TITLES = {
  "/dashboard": "Dashboard",
  "/live-fleet": "Live Map",
  "/vehicles": "Vehicles",
  "/drivers": "Drivers",
  "/trips": "Trips and Routes",
  "/route-risk-monitoring": "Route & Risk Monitoring",
  "/devices": "IoT Devices",
  "/maintenance": "Maintenance",
  "/reports": "Reports",
  "/settings": "Settings",
};

export const STATUS_COLORS = {
  Active: { bg: "#DCFCE7", fg: "#15803D" },
  Administrator: { bg: "#DBEAFE", fg: "#1D4ED8" },
  Dispatched: { bg: "#DBEAFE", fg: "#1D4ED8" },
  Open: { bg: "#FEE2E2", fg: "#B91C1C" },
  Acknowledged: { bg: "#DCFCE7", fg: "#15803D" },
  Reviewed: { bg: "#DCFCE7", fg: "#15803D" },
  Online: { bg: "#DCFCE7", fg: "#15803D" },
  Complete: { bg: "#DCFCE7", fg: "#15803D" },
  Low: { bg: "#DCFCE7", fg: "#15803D" },
  Stable: { bg: "#DCFCE7", fg: "#15803D" },
  Medium: { bg: "#FEF3C7", fg: "#B45309" },
  High: { bg: "#FEE2E2", fg: "#B91C1C" },
  Critical: { bg: "#FEE2E2", fg: "#B91C1C" },
  Offline: { bg: "#FEE2E2", fg: "#B91C1C" },
  Pending: { bg: "#FEF3C7", fg: "#B45309" },
  "No GPS": { bg: "#FEE2E2", fg: "#B91C1C" },
  "In Service": { bg: "#DBEAFE", fg: "#1D4ED8" },
  "Under Review": { bg: "#FEF3C7", fg: "#B45309" },
  Scheduled: { bg: "#DBEAFE", fg: "#1D4ED8" },
  Recorded: { bg: "#DCFCE7", fg: "#15803D" },
  Maintenance: { bg: "#FEF3C7", fg: "#B45309" },
  "On Leave": { bg: "#FEF3C7", fg: "#B45309" },
  Suspended: { bg: "#FEE2E2", fg: "#B91C1C" },
  Overdue: { bg: "#FEE2E2", fg: "#B91C1C" },
  Inactive: { bg: "#F1F5F9", fg: "#64748B" },
};

export const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.Inactive;



