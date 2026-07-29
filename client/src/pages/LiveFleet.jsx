import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import LiveFleetMap from "../components/maps/LiveFleetMap.jsx";
import RecentFleetEvents from "../components/maps/RecentFleetEvents.jsx";
import VehicleList from "../components/maps/VehicleList.jsx";
import PageHeader from "../components/PageHeader.jsx";
import useFleetFilters from "../hooks/useFleetFilters.js";
import { CONNECTION_STATUSES, RISK_LEVELS, VEHICLE_STATUSES } from "../config/fleetStatus.js";
import { getAdminDashboardData, subscribeToAdminDashboard } from "../services/dashboardService.js";


function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="fleet-filter-field">
      <span>{label}</span>
      <select className="input select" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function LiveMapFilterBar({ filters, resultCount, onFilterChange, onClearFilters }) {
  return (
    <div className="live-map-filter-bar" aria-label="Live map filters">
      <label className="fleet-filter-field live-map-search-field">
        <span>Search</span>
        <input className="input" value={filters.search} placeholder="Plate, code, or driver" onChange={(event) => onFilterChange("search", event.target.value)} />
      </label>
      <FilterSelect label="Status" value={filters.status} options={VEHICLE_STATUSES} onChange={(value) => onFilterChange("status", value)} />
      <FilterSelect label="GPS" value={filters.connection} options={CONNECTION_STATUSES} onChange={(value) => onFilterChange("connection", value)} />
      <FilterSelect label="Risk" value={filters.risk} options={RISK_LEVELS} onChange={(value) => onFilterChange("risk", value)} />
      <div className="live-map-filter-summary"><strong>{resultCount}</strong><span>vehicles shown</span></div>
      <button type="button" className="button ghost live-map-clear-button" onClick={onClearFilters}>Clear Filters</button>
    </div>
  );
}
function relativeTime(value) {
  if (!value) return "Time unavailable";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ago`;
}

export default function LiveFleet() {
  const [vehicles, setVehicles] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [vehicleListCollapsed, setVehicleListCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { filters, filteredVehicles, updateFilter, clearFilters } = useFleetFilters(vehicles);
  const { globalSearch = "" } = useOutletContext() || {};

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await getAdminDashboardData();
      setVehicles(result.mapVehicles);
      setEvents(result.alertRows.map((event) => ({ id: event.id, type: event.type, vehicle: event.vehicle, time: relativeTime(event.triggeredAt), severity: event.status === "Open" ? "High" : "Low", status: event.status })));
      setSelectedVehicleId((current) => result.mapVehicles.some((vehicle) => vehicle.id === current) ? current : result.mapVehicles[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError.message || "Unable to load live map data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const unsubscribe = subscribeToAdminDashboard(load); return unsubscribe; }, [load]);
  useEffect(() => { updateFilter("search", globalSearch); }, [globalSearch]);
  useEffect(() => { if (filteredVehicles.length && !filteredVehicles.some((vehicle) => vehicle.id === selectedVehicleId)) setSelectedVehicleId(filteredVehicles[0].id); }, [filteredVehicles, selectedVehicleId]);

  const fleetSummary = useMemo(() => {
    const moving = vehicles.filter((vehicle) => vehicle.status === "Moving").length;
    const attention = vehicles.filter((vehicle) => ["High", "Critical"].includes(vehicle.riskLevel)).length;
    const online = vehicles.filter((vehicle) => vehicle.gpsStatus !== "Offline" && vehicle.status !== "Offline").length;
    return [
      { label: "Tracked vehicles", value: vehicles.length, detail: `${online} reporting`, tone: "blue" },
      { label: "Currently moving", value: moving, detail: `${Math.max(vehicles.length - moving, 0)} stationary`, tone: "green" },
      { label: "Needs attention", value: attention, detail: attention ? "High-risk vehicles" : "No high-risk vehicles", tone: attention ? "red" : "green" },
      { label: "Open incidents", value: events.filter((event) => event.status === "Open").length, detail: `${events.length} recent events`, tone: "amber" },
    ];
  }, [events, vehicles]);
  if (loading) return <LoadingState title="Loading live map" description="Retrieving active trips and sensor telemetry from Supabase." />;
  if (error) return <Card><EmptyState title="Live map is unavailable" description={error} /><div className="resource-error"><button className="button primary" onClick={load}>Try again</button></div></Card>;

  const vehicleList = <VehicleList vehicles={filteredVehicles} selectedVehicleId={selectedVehicleId} onSelect={setSelectedVehicleId} filters={filters} onFilterChange={updateFilter} onClearFilters={clearFilters} collapsed={vehicleListCollapsed} onToggle={() => setVehicleListCollapsed((value) => !value)} showFilters={false} />;
  const liveMapFilters = <LiveMapFilterBar filters={filters} resultCount={filteredVehicles.length} onFilterChange={updateFilter} onClearFilters={clearFilters} />;
  return (
    <div className="live-fleet-page">
      <PageHeader
        eyebrow="Fleet Operations"
        title="Live Map"
        actions={<div className="live-fleet-page-actions"><span className="live-connection-state"><i />Live updates</span><Button variant="secondary" onClick={load}>Refresh</Button></div>}
      />
      <section className="live-fleet-overview" aria-label="Live map summary">
        {fleetSummary.map((item) => (
          <article className={`live-summary-card tone-${item.tone}`} key={item.label}>
            <div className="live-summary-icon" aria-hidden="true"><span /></div>
            <strong className="live-summary-value">{item.value}</strong>
            <div className="live-summary-copy"><span>{item.label}</span><small>{item.detail}</small></div>
          </article>
        ))}
      </section>
      {filteredVehicles.length ? (
        <LiveFleetMap vehicles={filteredVehicles} selectedVehicleId={selectedVehicleId} onSelectVehicle={setSelectedVehicleId} vehicleList={vehicleList} topToolbar={liveMapFilters} />
      ) : (
        <Card className="dashboard-map-empty"><EmptyState title="No live vehicle telemetry" description="Start a trip and record sensor coordinates to display it on the map." /></Card>
      )}
      <section className="live-fleet-activity" aria-label="Fleet activity">
        {events.length ? <RecentFleetEvents events={events} /> : <Card><EmptyState title="No recent incidents" description="Incident alerts will appear here when recorded." /></Card>}
      </section>
    </div>
  );
}