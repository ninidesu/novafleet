import { useCallback, useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LiveFleetMap from "../components/maps/LiveFleetMap.jsx";
import { getAdminDashboardData, subscribeToAdminDashboard } from "../services/dashboardService.js";

const EMPTY_DASHBOARD = {
  metrics: [],
  mapVehicles: [],
  tripRows: [],
  alertRows: [],
  maintenanceRows: [],
};

function relativeTime(value) {
  if (!value) return "Time unavailable";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return new Date(value).toLocaleDateString();
}

function formatCost(value) {
  if (value == null) return "Not recorded";
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value));
}

export default function Dashboard() {
  const [data, setData] = useState(EMPTY_DASHBOARD);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const nextData = await getAdminDashboardData();
      setData(nextData);
      setSelectedVehicleId((current) => (
        nextData.mapVehicles.some((vehicle) => vehicle.id === current)
          ? current
          : nextData.mapVehicles[0]?.id ?? null
      ));
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(loadError.message || "Unable to load fleet dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    let refreshTimer;
    const unsubscribe = subscribeToAdminDashboard(() => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => loadDashboard({ background: true }), 350);
    });
    return () => {
      window.clearTimeout(refreshTimer);
      unsubscribe();
    };
  }, [loadDashboard]);

  const tripColumns = [
    { key: "id", header: "Trip ID", render: (row) => <span title={row.id}>{row.id.slice(0, 8)}</span> },
    { key: "vehicle", header: "Vehicle" },
    { key: "driver", header: "Driver" },
    { key: "destination", header: "Destination" },
    { key: "tripStatus", header: "Status", render: (row) => <StatusBadge status={row.tripStatus} /> },
  ];

  if (loading) {
    return <LoadingState title="Loading fleet dashboard" description="Retrieving vehicles, trips, alerts, and telemetry from Supabase." />;
  }

  if (error && !data.metrics.length) {
    return (
      <Card className="dashboard-error-card">
        <EmptyState title="Dashboard data is unavailable" description={error} />
        <Button onClick={() => loadDashboard()}>Try again</Button>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administrator Overview"
        title="Fleet monitoring dashboard"
        description={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Fleet operations overview."}
        actions={<Button variant="secondary" onClick={() => loadDashboard({ background: true })} disabled={refreshing}>{refreshing ? "Refreshing..." : "Refresh data"}</Button>}
      />

      {error && <div className="dashboard-inline-error" role="alert">Latest refresh failed: {error}</div>}

      <div className="grid metrics-grid">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} meta={metric.meta} />
        ))}
      </div>

      {data.mapVehicles.length ? (
        <LiveFleetMap vehicles={data.mapVehicles} selectedVehicleId={selectedVehicleId} onSelectVehicle={setSelectedVehicleId} compact />
      ) : (
        <Card className="dashboard-map-empty">
          <EmptyState title="No live vehicle telemetry" description="Active trips will appear here after sensor readings with valid coordinates are received." />
        </Card>
      )}

      <div className="dashboard-alerts">
        <Card title="Recent Incident Alerts">
          {data.alertRows.length ? (
            <div className="alert-list">
              {data.alertRows.map((alert) => (
                <div className="alert-item" key={alert.id}>
                  <div className="alert-item-heading">
                    <strong>{alert.type}</strong>
                    <StatusBadge status={alert.status} />
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-meta">{alert.vehicle} · {relativeTime(alert.triggeredAt)}</div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No incident alerts" description="New fleet incidents will appear here when they are recorded." />}
        </Card>
      </div>

      <div className="grid dashboard-lower-grid">
        <Card title="Active Trips">
          <DataTable
            columns={tripColumns}
            rows={data.tripRows}
            emptyTitle="No active trips"
            emptyDescription="Dispatched and active trips will appear here."
          />
        </Card>
        <Card title="Recent Maintenance">
          {data.maintenanceRows.length ? data.maintenanceRows.map((record) => (
            <div className="maintenance-summary-row" key={record.id}>
              <div><strong>{record.vehicle}</strong><span>{record.type}</span></div>
              <div><strong>{record.date ? new Date(`${record.date}T00:00:00`).toLocaleDateString() : "No service date"}</strong><span>{formatCost(record.cost)}</span></div>
            </div>
          )) : <EmptyState title="No maintenance records" description="Recorded vehicle services will appear here." />}
        </Card>
      </div>
    </div>
  );
}