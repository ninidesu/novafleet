import { useNavigate } from "react-router-dom";
import StatusBadge from "../StatusBadge.jsx";
import { getVehicleFreshness } from "../../config/fleetStatus.js";

export default function VehicleDetailsPanel({ vehicle, compact = false }) {
  const navigate = useNavigate();
  if (!vehicle) return <div className="fleet-panel-empty">Select a vehicle to view its live details.</div>;

  const details = compact ? [
    ["Driver", vehicle.driver], ["Speed", `${vehicle.speed} km/h`], ["Trip", vehicle.currentTrip], ["Freshness", getVehicleFreshness(vehicle)],
  ] : [
    ["Vehicle Code", vehicle.id], ["Plate Number", vehicle.plateNumber], ["Driver", vehicle.driver], ["Current Status", vehicle.status],
    ["Speed", `${vehicle.speed} km/h`], ["Heading", vehicle.heading], ["GPS Status", vehicle.gpsStatus], ["Data Freshness", getVehicleFreshness(vehicle)],
    ["Network Status", vehicle.networkStatus], ["Battery Level", `${vehicle.battery}%`], ["Risk Score", `${vehicle.riskScore}  ${vehicle.riskLevel}`],
    ["Current Trip", vehicle.currentTrip], ["Origin", vehicle.origin], ["Destination", vehicle.destination], ["Trip Progress", `${vehicle.tripProgress}%`],
    ["Last Update", new Date(vehicle.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })],
    ["Last Sync", vehicle.lastSync], ["Pending Offline Records", vehicle.pendingOfflineRecords],
  ];

  return (
    <aside className={`fleet-details-panel ${compact ? "compact" : ""}`} aria-live="polite">
      <div className="fleet-panel-heading"><div><div className="fleet-panel-label">Selected Vehicle</div><h3>{vehicle.plateNumber}</h3><span>{vehicle.id}</span></div><StatusBadge status={vehicle.status} /></div>
      <div className="fleet-detail-list">{details.map(([label, value]) => <div className="fleet-detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      {!compact && <div className="fleet-panel-actions">
        <button type="button" onClick={() => navigate("/vehicles")}>View Vehicle</button>
        <button type="button" onClick={() => navigate("/trips")}>View Active Trip</button>
        <button type="button" onClick={() => navigate("/reports")}>View Route History</button>
        <button type="button" onClick={() => navigate("/route-deviations")}>View Alerts</button>
      </div>}
    </aside>
  );
}

