import { CONNECTION_STATUSES, RISK_LEVELS, VEHICLE_STATUSES, getVehicleFreshness } from "../../config/fleetStatus.js";

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

export default function VehicleList({ vehicles, selectedVehicleId, onSelect, filters, onFilterChange, onClearFilters, collapsed, onToggle, showFilters = true }) {
  return (
    <aside className={`vehicle-list-panel ${collapsed ? "collapsed" : ""}`}>
      <div className="vehicle-list-header">
        <div><strong>Vehicles</strong><span>{vehicles.length} results</span></div>
        <div className="vehicle-list-header-actions"><button type="button" className="fleet-list-toggle" onClick={onToggle}>{collapsed ? "Show" : "Hide"}</button>{showFilters && <button type="button" className="fleet-text-button" onClick={onClearFilters}>Clear Filters</button>}</div>
      </div>
      {showFilters && (
        <div className="vehicle-filters">
          <label className="fleet-filter-field fleet-search-field">
            <span>Search</span>
            <input className="input" value={filters.search} placeholder="Plate, code, or driver" onChange={(event) => onFilterChange("search", event.target.value)} />
          </label>
          <div className="vehicle-filter-grid">
            <FilterSelect label="Status" value={filters.status} options={VEHICLE_STATUSES} onChange={(value) => onFilterChange("status", value)} />
            <FilterSelect label="GPS" value={filters.connection} options={CONNECTION_STATUSES} onChange={(value) => onFilterChange("connection", value)} />
            <FilterSelect label="Risk" value={filters.risk} options={RISK_LEVELS} onChange={(value) => onFilterChange("risk", value)} />
          </div>
        </div>
      )}
      <div className="vehicle-list app-scroll">
        {vehicles.length === 0 ? (
          <div className="fleet-list-empty"><strong>No vehicles found</strong><span>Adjust or clear the filters to see more vehicles.</span></div>
        ) : vehicles.map((vehicle) => {
          const freshness = getVehicleFreshness(vehicle);
          const selected = vehicle.id === selectedVehicleId;
          return (
            <button type="button" className={`vehicle-list-item ${selected ? "selected" : ""}`} key={vehicle.id} onClick={() => onSelect(vehicle.id)}>
              <div className="vehicle-list-primary"><strong>{vehicle.plateNumber}</strong><span>{vehicle.id}</span><em>{vehicle.status}</em></div>
              <div className="vehicle-list-driver">{vehicle.driver}</div>
              <div className="vehicle-list-meta"><span>{vehicle.speed} km/h</span><span>{vehicle.currentTrip}</span></div>
              <div className="vehicle-list-meta"><span>{freshness}</span><span>GPS {vehicle.gpsStatus}</span><span>{vehicle.riskLevel} risk</span></div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}