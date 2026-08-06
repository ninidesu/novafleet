"""Turn raw trip data into a feature vector for scoring."""
from datetime import datetime

from geo import distance_to_polyline_m, path_length_km


def _num(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_route(raw):
    """Normalize a stored polyline into [(lat, lng)], fixing [lng, lat] order."""
    if not raw:
        return []
    coords = raw.get("coordinates") if isinstance(raw, dict) else raw
    if not isinstance(coords, list):
        return []
    out = []
    for point in coords:
        if not isinstance(point, (list, tuple)) or len(point) < 2:
            continue
        a, b = _num(point[0]), _num(point[1])
        if a is None or b is None:
            continue
        # Latitude is bounded by 90; if the first value exceeds that it's lng.
        out.append((b, a) if abs(a) > 90 else (a, b))
    return out


def _parse_ts(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def build_features(trip, readings, baseline, incidents, fuel_liters, route_threshold_m):
    points = []
    speeds = []
    times = []
    for r in readings:
        lat, lng = _num(r.get("lat")), _num(r.get("lng"))
        if lat is None or lng is None:
            continue
        points.append((lat, lng))
        s = _num(r.get("speed_kmh"))
        if s is not None:
            speeds.append(s)
        ts = _parse_ts(r.get("recorded_at"))
        if ts is not None:
            times.append(ts)

    distance_km = path_length_km(points)
    duration_min = 0.0
    if len(times) >= 2:
        duration_min = max(0.0, (max(times) - min(times)).total_seconds() / 60.0)

    avg_speed = sum(speeds) / len(speeds) if speeds else 0.0
    max_speed = max(speeds) if speeds else 0.0

    route = normalize_route(trip.get("planned_route_polyline"))
    deviations = [distance_to_polyline_m(p, route) for p in points] if route else []
    max_deviation = max(deviations) if deviations else None
    over = [d for d in deviations if d > route_threshold_m]
    # Approximate time spent off-route from the share of readings that deviate.
    deviation_duration_min = (len(over) / len(deviations) * duration_min) if deviations else 0.0

    harsh_count = 0
    max_accel = 0.0
    for a in incidents:
        kind = str(a.get("alert_type") or "").lower()
        spike = _num(a.get("accel_spike_value"))
        if "harsh" in kind or "accel" in kind or "brak" in kind or spike is not None:
            harsh_count += 1
        if spike is not None:
            max_accel = max(max_accel, spike)

    baseline_speed = _num((baseline or {}).get("avg_speed_kmh")) or 0.0
    speed_ratio = (avg_speed / baseline_speed) if baseline_speed > 0 else 1.0
    fuel_per_km = (fuel_liters / distance_km) if distance_km > 0 and fuel_liters else None

    return {
        "n_readings": len(points),
        "distance_km": distance_km,
        "duration_min": duration_min,
        "avg_speed": avg_speed,
        "max_speed": max_speed,
        "speed_ratio": speed_ratio,
        "baseline_speed": baseline_speed,
        "max_deviation_m": max_deviation,
        "deviation_duration_min": deviation_duration_min,
        "off_route_points": len(over),
        "harsh_count": harsh_count,
        "max_accel": max_accel,
        "fuel_per_km": fuel_per_km,
    }
