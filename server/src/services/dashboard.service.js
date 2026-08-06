import { fleetDb } from "../config/supabase.js";
import { fromDbError } from "../lib/httpError.js";
import { normalizeRoute, riskLevel, titleCase } from "../lib/format.js";

const ACTIVE_TRIP_EXCLUSIONS = new Set(["completed", "complete", "cancelled", "canceled"]);

function isActiveTrip(trip) {
  return !trip.end_time && !ACTIVE_TRIP_EXCLUSIONS.has(String(trip.status || "").toLowerCase());
}

function requireData(result, label) {
  if (result.error) throw fromDbError(result.error, label);
  return result.data || [];
}

export async function getAdminDashboardData() {
  const [
    vehiclesResult,
    driversResult,
    tripsResult,
    alertsResult,
    risksResult,
    maintenanceResult,
    readingsResult,
    anomaliesResult,
  ] = await Promise.all([
    fleetDb.from("vehicles").select(
      "id, plate_number, vehicle_type, model, status, assigned_driver_id, fuel_capacity_liters, odometer_km, created_at, assigned_driver:drivers!vehicles_assigned_driver_id_fkey(id, full_name, status)"
    ),
    fleetDb.from("drivers").select("id, full_name, status"),
    fleetDb.from("trips").select(
      "id, vehicle_id, driver_id, origin, destination, planned_route_polyline, dispatch_time, start_time, end_time, status, purpose, vehicle:vehicles!trips_vehicle_id_fkey(id, plate_number, status), driver:drivers!trips_driver_id_fkey(id, full_name, status)"
    ).order("dispatch_time", { ascending: false }),
    fleetDb.from("incident_alerts").select(
      "id, trip_id, vehicle_id, alert_type, accel_spike_value, gps_lat, gps_lng, triggered_at, acknowledged, vehicle:vehicles!incident_alerts_vehicle_id_fkey(id, plate_number)"
    ).order("triggered_at", { ascending: false }).limit(20),
    fleetDb.from("risk_scores").select(
      "id, trip_id, total_risk_score, behavior_anomaly_score, route_deviation_score, fuel_ratio_anomaly_score, flagged, reviewed_at"
    ),
    fleetDb.from("maintenance_records").select(
      "id, vehicle_id, maintenance_type, service_date, cost, notes, vehicle:vehicles!maintenance_records_vehicle_id_fkey(id, plate_number)"
    ).order("service_date", { ascending: false }).limit(20),
    fleetDb.from("sensor_readings").select("id, trip_id, recorded_at, lat, lng, speed_kmh, source").order("recorded_at", { ascending: false }).limit(500),
    fleetDb.from("route_anomalies").select("id, trip_id, max_deviation_meters, deviation_duration_min, flagged_at").order("flagged_at", { ascending: false }).limit(100),
  ]);

  const vehicles = requireData(vehiclesResult, "Vehicles");
  const drivers = requireData(driversResult, "Drivers");
  const trips = requireData(tripsResult, "Trips");
  const alerts = requireData(alertsResult, "Incident alerts");
  const risks = requireData(risksResult, "Risk scores");
  const maintenance = requireData(maintenanceResult, "Maintenance records");
  const readings = requireData(readingsResult, "Sensor readings");
  const anomalies = requireData(anomaliesResult, "Route anomalies");

  const activeTrips = trips.filter(isActiveTrip);
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
    { label: "Registered Vehicles", value: vehicles.length, meta: `${mapVehicles.length} reporting active-trip telemetry` },
    { label: "Active Drivers", value: drivers.filter((driver) => String(driver.status).toLowerCase() === "active").length, meta: `${drivers.length} total driver records` },
    { label: "Active Trips", value: activeTrips.length, meta: `${trips.length} trips recorded` },
    { label: "Open Alerts", value: alerts.filter((alert) => !alert.acknowledged).length, meta: `${alerts.length} recent incident alerts` },
    { label: "Flagged Risks", value: risks.filter((risk) => risk.flagged).length, meta: `${risks.length} risk assessments` },
    { label: "Maintenance Records", value: maintenance.length, meta: "Latest service activity" },
  ];

  return { metrics, mapVehicles, tripRows, alertRows, maintenanceRows, anomalyCount: anomalies.length };
}
