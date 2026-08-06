"""Supabase data access for the ML worker (service-role, fleet schema)."""
from functools import lru_cache

from supabase import Client, create_client

from config import config


@lru_cache(maxsize=1)
def get_client() -> Client:
    return create_client(config.supabase_url, config.supabase_service_role_key)


def _fleet():
    return get_client().schema(config.supabase_schema)


def fetch_trips(limit: int = 500):
    """Trips ordered newest first, with the fields the scorer needs."""
    res = (
        _fleet()
        .table("trips")
        .select("id, driver_id, vehicle_id, planned_route_polyline, start_time, end_time, status")
        .order("dispatch_time", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def fetch_trip(trip_id: str):
    res = (
        _fleet()
        .table("trips")
        .select("id, driver_id, vehicle_id, planned_route_polyline, start_time, end_time, status")
        .eq("id", trip_id)
        .maybe_single()
        .execute()
    )
    return res.data if res else None


def fetch_readings(trip_id: str):
    res = (
        _fleet()
        .table("sensor_readings")
        .select("lat, lng, speed_kmh, recorded_at")
        .eq("trip_id", trip_id)
        .order("recorded_at", desc=False)
        .execute()
    )
    return res.data or []


def fetch_driver_baseline(driver_id: str):
    if not driver_id:
        return None
    res = (
        _fleet()
        .table("driver_baseline")
        .select("avg_speed_kmh, harsh_accel_rate, harsh_brake_rate, samples")
        .eq("driver_id", driver_id)
        .maybe_single()
        .execute()
    )
    return res.data if res else None


def fetch_incidents(trip_id: str):
    res = (
        _fleet()
        .table("incident_alerts")
        .select("alert_type, accel_spike_value")
        .eq("trip_id", trip_id)
        .execute()
    )
    return res.data or []


def fetch_fuel_liters(trip_id: str) -> float:
    res = _fleet().table("fuel_logs").select("liters").eq("trip_id", trip_id).execute()
    return sum(float(r["liters"]) for r in (res.data or []) if r.get("liters") is not None)


def write_risk_score(trip_id: str, scores: dict):
    """Idempotent: the worker owns risk_scores per trip, so replace."""
    _fleet().table("risk_scores").delete().eq("trip_id", trip_id).execute()
    _fleet().table("risk_scores").insert(
        {
            "trip_id": trip_id,
            "behavior_anomaly_score": scores["behavior"],
            "route_deviation_score": scores["route"],
            "fuel_ratio_anomaly_score": scores["fuel"],
            "total_risk_score": scores["total"],
            "flagged": scores["flagged"],
        }
    ).execute()


def write_route_anomaly(trip_id: str, max_deviation_m: float, duration_min: float):
    """Replace the worker's anomaly for this trip; only insert if one exists."""
    _fleet().table("route_anomalies").delete().eq("trip_id", trip_id).execute()
    if max_deviation_m is None:
        return False
    _fleet().table("route_anomalies").insert(
        {
            "trip_id": trip_id,
            "max_deviation_meters": round(max_deviation_m, 1),
            "deviation_duration_min": round(duration_min, 1),
        }
    ).execute()
    return True
