import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

const METRO_MANILA_CENTER = [14.5995, 121.0223];

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
}

function PinIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

function formatPinnedAddress(coordinates) {
  return `Pinned location (${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)})`;
}

function formatAddress(result) {
  const address = result.address || {};
  const primary = result.name || address.road || address.suburb || address.city || address.town || address.municipality || address.province;
  const area = [address.city || address.town || address.municipality, address.state || address.province, address.country].filter(Boolean).join(", ");
  return [primary, area].filter(Boolean).join(", ") || result.display_name;
}

function vehicleTimingProfile(vehicle) {
  const descriptor = `${vehicle?.vehicle_type || ""} ${vehicle?.model || ""}`.toLowerCase();
  if (/motor|scooter|bike/.test(descriptor)) return { label: "Motorcycle", congestion: 1.45, stopDelayPerKm: 45, minimumMinutes: 8, range: .18 };
  if (/truck|lorry|heavy/.test(descriptor)) return { label: "Truck", congestion: 2.45, stopDelayPerKm: 105, minimumMinutes: 18, range: .28 };
  if (/van|transit|hiace|mpv|utility/.test(descriptor)) return { label: "Van", congestion: 2.15, stopDelayPerKm: 90, minimumMinutes: 14, range: .25 };
  if (/bus|shuttle/.test(descriptor)) return { label: "Shuttle", congestion: 2.3, stopDelayPerKm: 100, minimumMinutes: 17, range: .28 };
  if (/car|sedan|suv|pickup/.test(descriptor)) return { label: "Car", congestion: 1.85, stopDelayPerKm: 75, minimumMinutes: 12, range: .23 };
  return { label: vehicle?.vehicle_type || vehicle?.model || "Selected vehicle", congestion: 1.95, stopDelayPerKm: 80, minimumMinutes: 12, range: .24 };
}

function vehicleDisplayDetails(vehicle) {
  if (!vehicle) return "Select a vehicle";
  const type = vehicle.vehicle_type?.trim();
  const model = vehicle.model?.trim();
  if (model && type) return `${model} · ${type}`;
  return model || type || "Selected vehicle";
}

function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters <= 0) return "--";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 1 : 2)} km`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--";
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function estimateTrafficDuration(route, profile) {
  if (!route?.durationSeconds || !route?.distanceMeters) return null;
  const distanceKm = route.distanceMeters / 1000;
  const base = route.durationSeconds * profile.congestion;
  const stoplightDelay = distanceKm * profile.stopDelayPerKm;
  const conservative = Math.max(base + stoplightDelay, profile.minimumMinutes * 60);
  return {
    low: conservative,
    high: conservative * (1 + profile.range),
  };
}

function formatDurationRange(estimate) {
  if (!estimate) return "--";
  return `${formatDuration(estimate.low)} - ${formatDuration(estimate.high)}`;
}

async function fetchRoadRoute(from, destination) {
  if (!from || !destination) return { coordinates: [], distanceMeters: 0, durationSeconds: 0 };
  const coordinates = `${from[1]},${from[0]};${destination[1]},${destination[0]}`;
  const params = new URLSearchParams({ overview: "full", geometries: "geojson", steps: "false" });
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Road routing is unavailable right now.");
  const data = await response.json();
  const route = data.routes?.[0];
  const geometry = route?.geometry?.coordinates;
  if (!Array.isArray(geometry) || geometry.length < 2) throw new Error("No road route found for these points.");
  return {
    coordinates: geometry.map(([lng, lat]) => [lat, lng]),
    distanceMeters: Number(route.distance || 0),
    durationSeconds: Number(route.duration || 0),
  };
}

async function reversePhilippinesLocation(coordinates) {
  const params = new URLSearchParams({
    lat: String(coordinates[0]),
    lon: String(coordinates[1]),
    format: "jsonv2",
    addressdetails: "1",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return formatPinnedAddress(coordinates);
  const result = await response.json();
  const countryCode = result.address?.country_code;
  if (countryCode && countryCode.toLowerCase() !== "ph") return formatPinnedAddress(coordinates);
  return formatAddress(result);
}

function createRoutePin(label, color) {
  return L.divIcon({
    className: "trip-route-pin-wrapper",
    html: `<span class="trip-route-pin" style="--pin-color:${color}">${label}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

async function searchPhilippinesLocations(query) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "6",
    countrycodes: "ph",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Location search is unavailable right now.");
  const data = await response.json();
  return data.map((result) => ({
    id: result.place_id,
    label: formatAddress(result),
    fullLabel: result.display_name,
    coordinates: [Number(result.lat), Number(result.lon)],
  })).filter((result) => Number.isFinite(result.coordinates[0]) && Number.isFinite(result.coordinates[1]));
}

function RoutePreviewController({ from, destination }) {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 120);
    return () => window.clearTimeout(timer);
  }, [map]);
  useEffect(() => {
    const points = [from, destination].filter(Boolean);
    if (points.length === 2) map.fitBounds(L.latLngBounds(points), { padding: [54, 54], maxZoom: 14 });
    else if (points.length === 1) map.flyTo(points[0], 13, { duration: 0.45 });
  }, [destination, from, map]);
  return null;
}

function RoutePinClickHandler({ onPin }) {
  useMapEvents({
    contextmenu(event) {
      onPin([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

function RoutePreviewMap({ from, destination, route, routeLoading, routeError, selectedVehicle, onPin, onUndoPin, onClearPins }) {
  const hasRoute = from && destination;
  const routeCoordinates = route?.coordinates || [];
  const visibleRoute = routeCoordinates.length > 1 ? routeCoordinates : hasRoute ? [from, destination] : [];
  const center = from || destination || METRO_MANILA_CENTER;
  const profile = vehicleTimingProfile(selectedVehicle);
  const trafficEstimate = estimateTrafficDuration(route, profile);
  const vehicleDetails = vehicleDisplayDetails(selectedVehicle);
  const nextPinLabel = !from ? "Right-click map to set From" : !destination ? "Right-click map to set Destination" : "Both pins are set";
  return (
    <section className="trip-route-picker trip-form-wide" aria-label="Selected trip route map">
      <div className="trip-route-picker-header">
        <div><strong>Route preview</strong><span>{routeLoading ? "Finding road route..." : hasRoute ? "Route follows available roads" : nextPinLabel}</span></div>
        <div className="trip-route-picker-actions">
          <div className="trip-route-picker-legend"><span><i className="from" />From</span><span><i className="destination" />Destination</span></div>
          <button type="button" className="button ghost" onClick={onUndoPin} disabled={!from && !destination}>Undo Pin</button>
          <button type="button" className="button secondary" onClick={onClearPins} disabled={!from && !destination}>Clear Pins</button>
        </div>
      </div>
      <div className="trip-route-stats" aria-label="Route estimate">
        <div><span>Distance</span><strong>{formatDistance(route?.distanceMeters)}</strong></div>
        <div><span>Traffic-adjusted time</span><strong>{routeLoading ? "Calculating..." : formatDurationRange(trafficEstimate)}</strong></div>
        <div><span>Vehicle</span><strong>{vehicleDetails}</strong></div>
      </div>
      <div className="trip-route-picker-map">
        <MapContainer center={center} zoom={from || destination ? 13 : 6} scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" maxZoom={20} />
          <RoutePreviewController from={from} destination={destination} />
          <RoutePinClickHandler onPin={onPin} />
          {from && <Marker position={from} icon={createRoutePin("F", "#64748b")}><Tooltip direction="top">From</Tooltip></Marker>}
          {destination && <Marker position={destination} icon={createRoutePin("D", "#2563eb")}><Tooltip direction="top">Destination</Tooltip></Marker>}
          {visibleRoute.length > 1 && <Polyline positions={visibleRoute} pathOptions={{ color: "#2563eb", weight: 5, opacity: .78, dashArray: routeCoordinates.length > 1 ? undefined : "8 8" }} />}
        </MapContainer>
        <div className="trip-route-picker-hint">{routeLoading ? "Calculating route from roads..." : routeError || "Right-click on the map to drop pins. First pin is From, second pin is Destination."}</div>
      </div>
    </section>
  );
}

function AddressSearchField({ label, name, value, selected, error, onChange, onSelect, placeholder }) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => setQuery(value || ""), [value]);

  useEffect(() => {
    const term = query.trim();
    if (!focused || term.length < 3) {
      setResults([]);
      setSearchError("");
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setSearchError("");
    const timer = window.setTimeout(async () => {
      try {
        const next = await searchPhilippinesLocations(term);
        if (!cancelled) setResults(next);
      } catch (locationError) {
        if (!cancelled) setSearchError(locationError.message || "Unable to search locations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 450);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [focused, query]);

  const open = focused && (loading || searchError || results.length > 0 || query.trim().length >= 3);
  const update = (nextValue) => {
    setQuery(nextValue);
    onChange(name, nextValue);
    onSelect(name, null);
  };

  return (
    <label className="input-wrap address-search-field">
      <span className="address-label-row"><span className="input-label">{label}</span>{selected && <span className="address-selected-note"><PinIcon />Pin set</span>}</span>
      <span className="address-search-control">
        <SearchIcon />
        <input
          className="input"
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(event) => update(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 140)}
          autoComplete="off"
          required
        />
      </span>
      {open && (
        <div className="address-suggestions" role="listbox" aria-label={`${label} address suggestions`}>
          {loading && <div className="address-suggestion-state">Searching Philippines locations...</div>}
          {!loading && searchError && <div className="address-suggestion-state error">{searchError}</div>}
          {!loading && !searchError && results.length === 0 && <div className="address-suggestion-state">No matching Philippines locations found.</div>}
          {!loading && !searchError && results.map((result) => (
            <button
              type="button"
              key={result.id}
              role="option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(name, result.label); onSelect(name, result); setFocused(false); }}
            >
              <PinIcon />
              <span>{result.label}<small>{result.fullLabel}</small></span>
            </button>
          ))}
        </div>
      )}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export default function TripForm({ initialTrip, vehicles, drivers, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    purpose: initialTrip?.purpose || "",
    vehicleId: initialTrip?.vehicleId || "",
    driverId: initialTrip?.driverId || "",
    origin: initialTrip?.origin === "Not specified" ? "" : initialTrip?.origin || "",
    destination: initialTrip?.destination === "Not specified" ? "" : initialTrip?.destination || "",
    dispatchTime: toLocalDateTime(initialTrip?.scheduledDeparture),
    originCoordinates: initialTrip?.originCoordinates || null,
    destinationCoordinates: initialTrip?.destinationCoordinates || null,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [roadRoute, setRoadRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const selectedVehicle = useMemo(() => vehicles.find((vehicle) => vehicle.id === form.vehicleId) || null, [form.vehicleId, vehicles]);

  useEffect(() => {
    if (!form.originCoordinates || !form.destinationCoordinates) {
      setRoadRoute(null);
      setRouteError("");
      setRouteLoading(false);
      return undefined;
    }
    let cancelled = false;
    setRouteLoading(true);
    setRouteError("");
    fetchRoadRoute(form.originCoordinates, form.destinationCoordinates)
      .then((route) => { if (!cancelled) setRoadRoute(route); })
      .catch((error) => { if (!cancelled) { setRoadRoute(null); setRouteError(error.message || "Unable to calculate road route."); } })
      .finally(() => { if (!cancelled) setRouteLoading(false); });
    return () => { cancelled = true; };
  }, [form.originCoordinates, form.destinationCoordinates]);

  const change = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const selectLocation = (name, location) => {
    const coordinateKey = name === "origin" ? "originCoordinates" : "destinationCoordinates";
    setForm((current) => ({ ...current, [coordinateKey]: location?.coordinates || null }));
  };

  const setPinnedLocation = async (name, coordinates) => {
    const coordinateKey = name === "origin" ? "originCoordinates" : "destinationCoordinates";
    setForm((current) => ({ ...current, [name]: formatPinnedAddress(coordinates), [coordinateKey]: coordinates }));
    setErrors((current) => ({ ...current, [name]: "" }));
    const label = await reversePhilippinesLocation(coordinates);
    setForm((current) => {
      const currentCoordinates = current[coordinateKey];
      const samePin = currentCoordinates && currentCoordinates[0] === coordinates[0] && currentCoordinates[1] === coordinates[1];
      return samePin ? { ...current, [name]: label } : current;
    });
  };

  const pinFromMap = (coordinates) => {
    if (!form.originCoordinates) {
      setPinnedLocation("origin", coordinates);
      return;
    }
    if (!form.destinationCoordinates) {
      setPinnedLocation("destination", coordinates);
      return;
    }
    setPinnedLocation("destination", coordinates);
  };

  const undoPin = () => {
    setForm((current) => current.destinationCoordinates
      ? { ...current, destination: "", destinationCoordinates: null }
      : { ...current, origin: "", originCoordinates: null });
  };

  const clearPins = () => {
    setForm((current) => ({ ...current, origin: "", destination: "", originCoordinates: null, destinationCoordinates: null }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    ["purpose", "vehicleId", "driverId", "origin", "destination", "dispatchTime"].forEach((key) => {
      if (!form[key]) next[key] = "This field is required.";
    });
    if (!form.originCoordinates) next.origin = next.origin || "Choose a real Philippines location from the search results.";
    if (!form.destinationCoordinates) next.destination = next.destination || "Choose a real Philippines location from the search results.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit({
        ...form,
        plannedRoute: roadRoute?.coordinates?.length > 1 ? roadRoute.coordinates : [form.originCoordinates, form.destinationCoordinates],
      });
    } catch (error) {
      setSubmitError(error.message || "Unable to save trip.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label, name, type = "text") => (
    <label className="input-wrap">
      <span className="input-label">{label}</span>
      <input className="input" type={type} value={form[name]} onChange={(event) => change(name, event.target.value)} required />
      {errors[name] && <span className="field-error">{errors[name]}</span>}
    </label>
  );

  return (
    <form className="card trip-form" onSubmit={submit}>
      {submitError && <div className="trip-form-alert" role="alert">{submitError}</div>}
      <div className="trip-form-grid">
        {field("Trip purpose", "purpose")}
        <label className="input-wrap">
          <span className="input-label">Vehicle</span>
          <select className="input select" value={form.vehicleId} onChange={(event) => change("vehicleId", event.target.value)} required>
            <option value="">Select vehicle</option>
            {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate_number}{vehicle.vehicle_type ? ` - ${vehicle.vehicle_type}` : vehicle.model ? ` - ${vehicle.model}` : ""}</option>)}
          </select>
          {errors.vehicleId && <span className="field-error">{errors.vehicleId}</span>}
        </label>
        <label className="input-wrap">
          <span className="input-label">Driver</span>
          <select className="input select" value={form.driverId} onChange={(event) => change("driverId", event.target.value)} required>
            <option value="">Select driver</option>
            {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name}</option>)}
          </select>
          {errors.driverId && <span className="field-error">{errors.driverId}</span>}
        </label>
        <AddressSearchField label="From" name="origin" value={form.origin} selected={form.originCoordinates} error={errors.origin} onChange={change} onSelect={selectLocation} placeholder="Search real Philippines pickup location" />
        <AddressSearchField label="Destination" name="destination" value={form.destination} selected={form.destinationCoordinates} error={errors.destination} onChange={change} onSelect={selectLocation} placeholder="Search real Philippines destination" />
        {field("Dispatch date and time", "dispatchTime", "datetime-local")}
        <RoutePreviewMap from={form.originCoordinates} destination={form.destinationCoordinates} route={roadRoute} routeLoading={routeLoading} routeError={routeError} selectedVehicle={selectedVehicle} onPin={pinFromMap} onUndoPin={undoPin} onClearPins={clearPins} />
      </div>
      <div className="trip-form-actions">
        <button type="button" className="button secondary" onClick={onCancel}>Cancel</button>
        <button className="button primary" disabled={submitting}>{submitting ? "Saving..." : initialTrip ? "Save Changes" : "Create Trip"}</button>
      </div>
    </form>
  );
}