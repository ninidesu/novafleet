import { publicSchema, supabase } from "./supabase.js";

function requireData(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data || [];
}

function titleCase(value, fallback = "Unknown") {
  return value ? String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : fallback;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

function riskLevel(score) {
  const value = Number(score || 0);
  if (value >= 80) return "Critical";
  if (value >= 60) return "High";
  if (value >= 30) return "Medium";
  return "Low";
}

export async function getVehicles() {
  const result = await supabase.from("vehicles").select("id, plate_number, vehicle_type, model, status, fuel_capacity_liters, odometer_km, created_at, assigned_driver:drivers!vehicles_assigned_driver_id_fkey(id, full_name)").order("plate_number");
  return requireData(result, "Vehicles").map((row) => ({
    id: row.id,
    plateNumber: row.plate_number,
    vehicleType: titleCase(row.vehicle_type, "Not specified"),
    model: row.model || "Not specified",
    assignedDriver: row.assigned_driver?.full_name || "Unassigned",
    status: titleCase(row.status),
    fuelCapacity: row.fuel_capacity_liters == null ? "Not recorded" : `${row.fuel_capacity_liters} L`,
    odometer: row.odometer_km == null ? "Not recorded" : `${Number(row.odometer_km).toLocaleString()} km`,
  }));
}

export async function getDrivers() {
  const result = await supabase.from("drivers").select("id, full_name, license_number, contact_number, status, created_at, vehicles!vehicles_assigned_driver_id_fkey(id, plate_number)").order("full_name");
  return requireData(result, "Drivers").map((row) => ({
    id: row.id,
    name: row.full_name,
    licenseNumber: row.license_number || "Not recorded",
    contactNumber: row.contact_number || "Not recorded",
    assignedVehicle: row.vehicles?.[0]?.plate_number || "Unassigned",
    status: titleCase(row.status),
    createdAt: formatDate(row.created_at),
  }));
}

export async function getRouteAnomalies() {
  const result = await supabase.from("route_anomalies").select("id, trip_id, max_deviation_meters, deviation_duration_min, flagged_at, trip:trips!route_anomalies_trip_id_fkey(id, vehicle:vehicles!trips_vehicle_id_fkey(plate_number), driver:drivers!trips_driver_id_fkey(full_name))").order("flagged_at", { ascending: false });
  return requireData(result, "Route deviations").map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    vehicle: row.trip?.vehicle?.plate_number || "Unknown vehicle",
    driver: row.trip?.driver?.full_name || "Unknown driver",
    detectedTime: formatDate(row.flagged_at),
    deviationDistance: row.max_deviation_meters == null ? "Not recorded" : `${Number(row.max_deviation_meters).toLocaleString()} m`,
    duration: row.deviation_duration_min == null ? "Not recorded" : `${row.deviation_duration_min} min`,
  }));
}

export async function getRiskScores() {
  const result = await supabase.from("risk_scores").select("id, trip_id, behavior_anomaly_score, route_deviation_score, fuel_ratio_anomaly_score, total_risk_score, flagged, reviewed_at, trip:trips!risk_scores_trip_id_fkey(id, driver:drivers!trips_driver_id_fkey(full_name), vehicle:vehicles!trips_vehicle_id_fkey(plate_number))").order("total_risk_score", { ascending: false });
  return requireData(result, "Risk scores").map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    driver: row.trip?.driver?.full_name || "Unknown driver",
    vehicle: row.trip?.vehicle?.plate_number || "Unknown vehicle",
    score: Number(row.total_risk_score || 0),
    riskLevel: riskLevel(row.total_risk_score),
    behaviorScore: Number(row.behavior_anomaly_score || 0),
    routeScore: Number(row.route_deviation_score || 0),
    fuelScore: Number(row.fuel_ratio_anomaly_score || 0),
    reviewStatus: row.reviewed_at ? "Reviewed" : row.flagged ? "Pending" : "Stable",
  }));
}

export async function getMaintenanceRecords() {
  const result = await supabase.from("maintenance_records").select("id, vehicle_id, maintenance_type, service_date, cost, notes, vehicle:vehicles!maintenance_records_vehicle_id_fkey(plate_number)").order("service_date", { ascending: false });
  return requireData(result, "Maintenance").map((row) => ({
    id: row.id,
    vehicle: row.vehicle?.plate_number || "Unknown vehicle",
    maintenanceType: titleCase(row.maintenance_type, "Maintenance"),
    serviceDate: row.service_date ? new Date(`${row.service_date}T00:00:00`).toLocaleDateString() : "Not recorded",
    cost: row.cost == null ? "Not recorded" : new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(row.cost)),
    notes: row.notes || "—",
  }));
}

export async function getAdminReportSummaries() {
  const tables = ["vehicles", "drivers", "trips", "sensor_readings", "incident_alerts", "risk_scores", "route_anomalies", "maintenance_records", "fuel_logs"];
  const results = await Promise.all(tables.map((table) => supabase.from(table).select("*", { count: "exact", head: true })));
  results.forEach((result, index) => { if (result.error) throw new Error(`${tables[index]}: ${result.error.message}`); });
  const counts = Object.fromEntries(tables.map((table, index) => [table, results[index].count || 0]));
  return [
    { id: "fleet", title: "Fleet Inventory", value: counts.vehicles, description: `${counts.drivers} drivers assigned across the fleet.` },
    { id: "trips", title: "Trip Operations", value: counts.trips, description: `${counts.sensor_readings} telemetry readings recorded.` },
    { id: "safety", title: "Safety Monitoring", value: counts.incident_alerts, description: `${counts.risk_scores} risk assessments and ${counts.route_anomalies} route anomalies.` },
    { id: "maintenance", title: "Maintenance Activity", value: counts.maintenance_records, description: `${counts.fuel_logs} fuel logs available for operational review.` },
  ];
}

export async function getCurrentProfile() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error(authError?.message || "No authenticated user.");
  const result = await publicSchema.from("profiles").select("id, full_name, role, module, created_at").eq("id", authData.user.id).single();
  if (result.error) throw new Error(result.error.message);
  return { ...result.data, email: authData.user.email };
}

export async function updateCurrentProfile(fullName) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error(authError?.message || "No authenticated user.");
  const result = await publicSchema.from("profiles").update({ full_name: fullName.trim() }).eq("id", authData.user.id).select("id, full_name, role, module, created_at").single();
  if (result.error) throw new Error(result.error.message);
  return { ...result.data, email: authData.user.email };
}