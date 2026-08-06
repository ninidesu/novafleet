"""Orchestration: load trips, build features, score, write results back."""
import logging

import db
from config import config
from features import build_features
from scoring import BehaviorAnomalyModel, compute_scores

log = logging.getLogger("novafleet.ml")


def _load_features_for(trip):
    readings = db.fetch_readings(trip["id"])
    if len(readings) < config.min_readings:
        return None
    baseline = db.fetch_driver_baseline(trip.get("driver_id"))
    incidents = db.fetch_incidents(trip["id"])
    fuel = db.fetch_fuel_liters(trip["id"])
    return build_features(trip, readings, baseline, incidents, fuel, config.route_deviation_threshold_m)


def _process(trip, features, model):
    trip_id = trip["id"]
    anomaly = model.factor(features)
    scores = compute_scores(
        features,
        config.route_deviation_threshold_m,
        config.risk_flag_threshold,
        anomaly_factor=anomaly,
    )
    db.write_risk_score(trip_id, scores)

    max_dev = features.get("max_deviation_m")
    anomaly_written = False
    if max_dev is not None and max_dev > config.route_deviation_threshold_m:
        anomaly_written = db.write_route_anomaly(trip_id, max_dev, features["deviation_duration_min"])
    else:
        db.write_route_anomaly(trip_id, None, 0.0)  # clear any stale anomaly

    log.info(
        "trip %s | total=%.1f behavior=%.1f route=%.1f fuel=%.1f flagged=%s dev=%s anomaly_factor=%.2f",
        trip_id[:8],
        scores["total"],
        scores["behavior"],
        scores["route"],
        scores["fuel"],
        scores["flagged"],
        f"{max_dev:.0f}m" if max_dev is not None else "n/a",
        anomaly,
    )
    return scores, anomaly_written


def run_once(trip_id=None):
    """Score one trip (if trip_id given) or all trips with enough telemetry."""
    trips = [db.fetch_trip(trip_id)] if trip_id else db.fetch_trips()
    trips = [t for t in trips if t]
    if not trips:
        log.info("No trips to process.")
        return {"processed": 0, "flagged": 0, "anomalies": 0}

    # First pass: build features so the anomaly model can fit on the population.
    prepared = []
    for trip in trips:
        try:
            f = _load_features_for(trip)
        except Exception as exc:  # noqa: BLE001 - one bad trip shouldn't stop the run
            log.warning("feature build failed for trip %s: %s", trip.get("id"), exc)
            continue
        if f is not None:
            prepared.append((trip, f))

    if not prepared:
        log.info("No trips have enough telemetry (min_readings=%s).", config.min_readings)
        return {"processed": 0, "flagged": 0, "anomalies": 0}

    model = BehaviorAnomalyModel().fit([f for _, f in prepared])

    processed = flagged = anomalies = 0
    for trip, f in prepared:
        try:
            scores, anomaly_written = _process(trip, f, model)
            processed += 1
            flagged += int(scores["flagged"])
            anomalies += int(anomaly_written)
        except Exception as exc:  # noqa: BLE001
            log.warning("scoring failed for trip %s: %s", trip.get("id"), exc)

    summary = {"processed": processed, "flagged": flagged, "anomalies": anomalies}
    log.info("Run complete: %s", summary)
    return summary
