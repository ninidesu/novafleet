import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { fleetStatusConfig, getVehicleFreshness } from "../../config/fleetStatus.js";
import MapControls from "./MapControls.jsx";
import MapLegend from "./MapLegend.jsx";
import VehicleDetailsPanel from "./VehicleDetailsPanel.jsx";
import { getVehicleRouteLayers } from "./routeLayers.js";

const METRO_MANILA_CENTER = [14.6091, 121.0223];

function createVehicleIcon(vehicle, selected) {
  const config = fleetStatusConfig[vehicle.status] || fleetStatusConfig.Offline;
  return L.divIcon({
    className: "vehicle-marker-wrapper",
    html: `<span class="vehicle-marker ${selected ? "selected" : ""}" style="--marker-color:${config.color}"><b>${config.symbol}</b></span>`,
    iconSize: selected ? [36, 36] : [30, 30],
    iconAnchor: selected ? [18, 18] : [15, 15],
    popupAnchor: [0, -16],
  });
}

function MapController({ vehicles, selectedVehicle, fitRequest, centerRequest, followVehicle }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (!fitRequest || vehicles.length === 0) return;
    const bounds = L.latLngBounds(vehicles.map((vehicle) => [vehicle.latitude, vehicle.longitude]));
    map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
  }, [fitRequest, map, vehicles]);

  useEffect(() => {
    if (selectedVehicle) map.flyTo([selectedVehicle.latitude, selectedVehicle.longitude], Math.max(map.getZoom(), 13), { duration: 0.5 });
  }, [centerRequest, map, selectedVehicle?.id]);

  useEffect(() => {
    if (followVehicle && selectedVehicle) map.panTo([selectedVehicle.latitude, selectedVehicle.longitude], { animate: true, duration: 0.5 });
  }, [followVehicle, map, selectedVehicle?.latitude, selectedVehicle?.longitude]);

  return null;
}

export default function LiveFleetMap({ vehicles, selectedVehicleId, onSelectVehicle, compact = false, vehicleList = null, topToolbar = null }) {
  const navigate = useNavigate();
  const [followVehicle, setFollowVehicle] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(!compact);
  const [fitRequest, setFitRequest] = useState(1);
  const [centerRequest, setCenterRequest] = useState(0);
  const [routeVisibility, setRouteVisibility] = useState({ planned: true, actual: true, deviation: true });
  const selectedVehicle = useMemo(() => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0] ?? null, [vehicles, selectedVehicleId]);
  const routeLayers = useMemo(() => getVehicleRouteLayers(selectedVehicle).filter((layer) => routeVisibility[layer.id]), [routeVisibility, selectedVehicle]);

  const selectVehicle = (vehicleId) => {
    onSelectVehicle(vehicleId);
    setCenterRequest((request) => request + 1);
  };

  return (
    <section className={`card live-fleet-card ${compact ? "dashboard-map-card" : "full-map-card"}`}>
      <div className="live-fleet-header">
        <div><h2 className="card-title">Live Map</h2><p>Vehicle positions and operational status</p></div>
        {compact ? <div className="dashboard-map-actions"><button type="button" onClick={() => setFitRequest((request) => request + 1)}>Fit All</button><button type="button" onClick={() => navigate("/live-fleet")}>View Live Map</button></div> : (
          <MapControls
            followVehicle={followVehicle}
            labelsVisible={labelsVisible}
            routeVisibility={routeVisibility}
            onFitAll={() => setFitRequest((request) => request + 1)}
            onCenterSelected={() => setCenterRequest((request) => request + 1)}
            onToggleFollow={() => setFollowVehicle((enabled) => !enabled)}
            onToggleLabels={() => setLabelsVisible((visible) => !visible)}
            onToggleRoute={(route) => setRouteVisibility((current) => ({ ...current, [route]: !current[route] }))}
          />
        )}
      </div>
      {topToolbar}
      <MapLegend compact={compact} />
      <div className={`live-fleet-layout ${vehicleList ? "with-list" : ""}`}>
        {vehicleList}
        <div className="live-fleet-map" aria-label="Interactive Metro Manila fleet map">
          <MapContainer center={METRO_MANILA_CENTER} zoom={12} scrollWheelZoom>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" maxZoom={20} />
            <MapController vehicles={vehicles} selectedVehicle={selectedVehicle} fitRequest={fitRequest} centerRequest={centerRequest} followVehicle={followVehicle} />
            {routeLayers.map((layer) => <Polyline key={layer.id} positions={layer.positions} pathOptions={layer.style} />)}
            {vehicles.map((vehicle) => (
              <Marker key={vehicle.id} position={[vehicle.latitude, vehicle.longitude]} icon={createVehicleIcon(vehicle, vehicle.id === selectedVehicle?.id)} eventHandlers={{ click: () => selectVehicle(vehicle.id) }}>
                {labelsVisible && <Tooltip permanent direction="top" offset={[0, -14]}>{vehicle.plateNumber}</Tooltip>}
                <Popup>
                  <div className="vehicle-popup">
                    <strong>{vehicle.plateNumber}</strong><span>Vehicle Code: {vehicle.id}</span><span>Driver: {vehicle.driver}</span>
                    <span>Speed: {vehicle.speed} km/h</span><span>Status: {vehicle.status}</span><span>Current Trip: {vehicle.currentTrip}</span>
                    <span>Risk Level: {vehicle.riskLevel}</span><span>GPS Status: {vehicle.gpsStatus}</span><span>Freshness: {getVehicleFreshness(vehicle)}</span>
                    <div className="vehicle-popup-actions"><button type="button" onClick={() => selectVehicle(vehicle.id)}>View Details</button><button type="button" onClick={() => { selectVehicle(vehicle.id); setFollowVehicle(true); }}>Follow Vehicle</button></div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <VehicleDetailsPanel vehicle={selectedVehicle} compact={compact} />
      </div>
      {/* Future integrations: Socket.IO GPS streams, clustering, geofences, trip playback, and backend route calculations. */}
    </section>
  );
}

