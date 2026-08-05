import { supabase } from "./supabase.js";

const ACTIVE_TRIP_EXCLUSIONS = new Set(["completed", "complete", "cancelled", "canceled"]);

function titleCase(value, fallback = "Unknown") {
  if (!value) return fallback;
  return String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function riskLevel(score) {
  const value = Number(score || 0);
  if (value >= 80) return "Critical";
  if (value >= 60) return "High";
  if (value >= 30) return "Medium";
  return "Low";
}

function normalizeRoute(route) {
  if (!route) return [];
  const coordinates = Array.isArray(route) ? route : route.coordinates;
  if (!Array.isArray(coordinates)) return [];
  return coordinates
    .map((point) => {
      if (Array.isArray(point) && point.length >= 2) {
        const first = Number(point[0]);
        const second = Number(point[1]);
        if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
        return Math.abs(first) > 90 ? [second, first] : [first, second];
      }
      return null;
    })
    .filter(Boolean);
}

function isActiveTrip(trip) {
  return !trip.end_time && !ACTIVE_TRIP_EXCLUSIONS.has(String(trip.status || "").toLowerCase());
}

function requireData(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data || [];
}

function optionalData(result) {
  return result.error ? [] : result.data || [];
}

export async function getAdminDashboardData() {
  const [
    vehiclesResult,
    devicesResult,
    driversResult,
    tripsResult,
    alertsResult,
    risksResult,
    maintenanceResult,
    readingsResult,
    anomaliesResult,
  ] = await Promise.all([
    supabase.from("vehicles").select("id, plate_number, vehicle_type, model, status, assigned_driver_id, fuel_capacity_liters, odometer_km, created_at"),
    supabase.from("iot_devices").select("id, vehicle_id, connection_status, gps_status, last_seen_at, latitude, longitude, location_updated_at"),
    supabase.from("drivers").select("id, full_name, status"),
    supabase.from("trips").select("id, vehicle_id, driver_id, origin, destination, planned_route_polyline, dispatch_time, start_time, end_time, status, purpose, vehicle:vehicles!trips_vehicle_id_fkey(id, plate_number, status), driver:drivers!trips_driver_id_fkey(id, full_name, status)").order("dispatch_time", { ascending: false }),
    supabase.from("incident_alerts").select("id, trip_id, vehicle_id, alert_type, accel_spike_value, gps_lat, gps_lng, triggered_at, acknowledged, vehicle:vehicles!incident_alerts_vehicle_id_fkey(id, plate_number)").order("triggered_at", { ascending: false }).limit(20),
    supabase.from("risk_scores").select("id, trip_id, total_risk_score, behavior_anomaly_score, route_deviation_score, fuel_ratio_anomaly_score, flagged, reviewed_at"),
    supabase.from("maintenance_records").select("id, vehicle_id, maintenance_type, service_date, cost, notes, vehicle:vehicles!maintenance_records_vehicle_id_fkey(id, plate_number)").order("service_date", { ascending: false }).limit(20),
    supabase.from("sensor_readings").select("id, trip_id, recorded_at, lat, lng, speed_kmh, source").order("recorded_at", { ascending: false }).limit(500),
    supabase.from("route_anomalies").select("id, trip_id, max_deviation_meters, deviation_duration_min, flagged_at").order("flagged_at", { ascending: false }).limit(100),
  ]);

  const vehicles = requireData(vehiclesResult, "Vehicles");
  const devices = optionalData(devicesResult);
  const drivers = optionalData(driversResult);
  const trips = optionalData(tripsResult);
  const alerts = optionalData(alertsResult);
  const risks = optionalData(risksResult);
  const maintenance = optionalData(maintenanceResult);
  const readings = optionalData(readingsResult);
  const anomalies = optionalData(anomaliesResult);

  const activeTrips = trips.filter(isActiveTrip);
  const driverById = new Map(drivers.map((driver) => [driver.id, driver]));
  const deviceByVehicle = new Map(devices.filter((device) => device.vehicle_id).map((device) => [device.vehicle_id, device]));
  const activeTripByVehicle = new Map(activeTrips.map((trip) => [trip.vehicle_id, trip]));
  const riskByTrip = new Map(risks.map((risk) => [risk.trip_id, risk]));
  const readingsByTrip = new Map();

  readings.forEach((reading) => {
    const lat = Number(reading.lat);
    const lng = Number(reading.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const list = readingsByTrip.get(reading.trip_id) || [];
    list.push({ ...reading, lat, lng, speed_kmh: Number(reading.speed_kmh || 0) });
    readingsByTrip.set(reading.trip_id, list);
  });

  const mapVehicles = vehicles.flatMap((vehicle) => {
    const trip = activeTripByVehicle.get(vehicle.id);
    if (!trip) return [];
    const tripReadings = readingsByTrip.get(trip.id) || [];
    const latest = tripReadings[0];
    if (!latest) return [];

    const updatedAt = new Date(latest.recorded_at).getTime();
    const ageMinutes = (Date.now() - updatedAt) / 60000;
    const status = ageMinutes > 10 ? "Offline" : latest.speed_kmh > 2 ? "Moving" : "Idle";
    const risk = riskByTrip.get(trip.id);
    const actualRoute = [...tripReadings].reverse().map((reading) => [reading.lat, reading.lng]);

    return [{
      id: vehicle.id,
      plateNumber: vehicle.plate_number,
      driver: trip.driver?.full_name || vehicle.assigned_driver?.full_name || "Unassigned",
      latitude: latest.lat,
      longitude: latest.lng,
      status,
      speed: Math.round(latest.speed_kmh),
      heading: "Not available",
      updatedAt,
      currentTrip: trip.id,
      origin: trip.origin || "Not specified",
      destination: trip.destination || "Not specified",
      tripProgress: 0,
      riskLevel: riskLevel(risk?.total_risk_score),
      riskScore: Number(risk?.total_risk_score || 0),
      gpsStatus: status === "Offline" ? "Offline" : "Online",
      networkStatus: titleCase(latest.source, "Unknown"),
      battery: 0,
      lastSync: new Date(latest.recorded_at).toLocaleString(),
      pendingOfflineRecords: 0,
      plannedRoute: normalizeRoute(trip.planned_route_polyline),
      actualRoute,
      deviationRoute: [],
    }];
  });

  const mappedVehicleIds = new Set(mapVehicles.map((vehicle) => vehicle.id));
  const iotMapVehicles = vehicles.flatMap((vehicle) => {
    if (mappedVehicleIds.has(vehicle.id)) return [];
    const device = deviceByVehicle.get(vehicle.id);
    const latitude = Number(device?.latitude);
    const longitude = Number(device?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const updatedAt = device.location_updated_at || device.last_seen_at || null;
    const ageMinutes = updatedAt ? (Date.now() - new Date(updatedAt).getTime()) / 60000 : Infinity;
    const status = ageMinutes > 10 ? "Offline" : "Idle";
    return [{
      id: vehicle.id,
      plateNumber: vehicle.plate_number,
      driver: driverById.get(vehicle.assigned_driver_id)?.full_name || "Unassigned",
      latitude,
      longitude,
      status,
      speed: 0,
      heading: "Not available",
      updatedAt,
      currentTrip: "No active trip",
      origin: "IoT device location",
      destination: "",
      tripProgress: 0,
      riskLevel: "Low",
      riskScore: 0,
      gpsStatus: device.gps_status || "Unknown",
      networkStatus: device.connection_status || "Unknown",
      battery: 0,
      lastSync: updatedAt ? new Date(updatedAt).toLocaleString() : "Time unavailable",
      pendingOfflineRecords: 0,
      plannedRoute: [],
      actualRoute: [],
      deviationRoute: [],
    }];
  });
  const liveMapVehicles = [...mapVehicles, ...iotMapVehicles];
  const tripRows = activeTrips.slice(0, 8).map((trip) => ({
    id: trip.id,
    vehicle: trip.vehicle?.plate_number || "Unassigned",
    driver: trip.driver?.full_name || "Unassigned",
    destination: trip.destination || "Not specified",
    tripStatus: titleCase(trip.status, "Dispatched"),
  }));

  const alertRows = alerts.slice(0, 6).map((alert) => ({
    id: alert.id,
    type: titleCase(alert.alert_type, "Incident"),
    vehicle: alert.vehicle?.plate_number || "Unknown vehicle",
    status: alert.acknowledged ? "Acknowledged" : "Open",
    message: alert.accel_spike_value != null
      ? `Acceleration spike recorded: ${Number(alert.accel_spike_value).toFixed(2)}`
      : "Fleet incident requires operational review.",
    triggeredAt: alert.triggered_at,
  }));

  const maintenanceRows = maintenance.slice(0, 5).map((record) => ({
    id: record.id,
    vehicle: record.vehicle?.plate_number || "Unknown vehicle",
    type: titleCase(record.maintenance_type, "Maintenance"),
    date: record.service_date,
    cost: record.cost,
  }));

  const metrics = [
    { label: "Registered Vehicles", value: vehicles.length, meta: `${liveMapVehicles.length} reporting locations` },
    { label: "Active Drivers", value: drivers.filter((driver) => String(driver.status).toLowerCase() === "active").length, meta: `${drivers.length} total driver records` },
    { label: "Active Trips", value: activeTrips.length, meta: `${trips.length} trips recorded` },
    { label: "Open Alerts", value: alerts.filter((alert) => !alert.acknowledged).length, meta: `${alerts.length} recent incident alerts` },
    { label: "Flagged Risks", value: risks.filter((risk) => risk.flagged).length, meta: `${risks.length} risk assessments` },
    { label: "Maintenance Records", value: maintenance.length, meta: "Latest service activity" },
  ];

  return { metrics, mapVehicles: liveMapVehicles, tripRows, alertRows, maintenanceRows, anomalyCount: anomalies.length };
}

export function subscribeToAdminDashboard(onChange) {
  const channel = supabase.channel("admin-dashboard-fleet-updates");
  ["vehicles", "drivers", "iot_devices", "trips", "sensor_readings", "incident_alerts", "risk_scores", "route_anomalies", "maintenance_records"].forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "fleet", table }, onChange);
  });
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}