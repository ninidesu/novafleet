"""Risk scoring + route-anomaly decisions.

v1 is a transparent, feature-based scorer that emits the same 0-100 component
scores the schema expects, with an optional IsolationForest anomaly signal
layered on top of driver behavior. This module is the seam for a trained model:
swap `BehaviorAnomalyModel` / `compute_scores` for a learned estimator later
without touching the worker or DB code.
"""
import numpy as np

try:
    from sklearn.ensemble import IsolationForest

    _HAS_SKLEARN = True
except ImportError:  # keep the worker usable without sklearn
    _HAS_SKLEARN = False


def _clamp(x):
    return float(max(0.0, min(100.0, x)))


def route_deviation_score(f, threshold_m):
    dev = f.get("max_deviation_m")
    if not dev:
        return 0.0
    # threshold -> 50, 2x threshold -> 100.
    base = (dev / threshold_m) * 50.0
    duration_bump = min(20.0, f.get("deviation_duration_min", 0.0) * 2.0)
    return _clamp(base + duration_bump)


def behavior_score(f, anomaly_factor=0.0):
    harsh = min(50.0, f.get("harsh_count", 0) * 18.0)
    ratio = f.get("speed_ratio", 1.0)
    speeding = max(0.0, (ratio - 1.15)) * 120.0
    speeding = min(30.0, speeding)
    if f.get("max_speed", 0) > 100:
        speeding = min(35.0, speeding + 10.0)
    accel = min(20.0, (f.get("max_accel", 0.0) / 4.0) * 20.0)
    ml_bump = anomaly_factor * 25.0  # IsolationForest contribution
    return _clamp(harsh + speeding + accel + ml_bump)


def fuel_score(f):
    fpk = f.get("fuel_per_km")
    if not fpk:
        return 0.0
    # Typical consumption ~0.08-0.15 L/km; escalate above that.
    return _clamp((fpk - 0.15) / 0.15 * 100.0)


def compute_scores(f, threshold_m, flag_threshold, anomaly_factor=0.0):
    behavior = behavior_score(f, anomaly_factor)
    route = route_deviation_score(f, threshold_m)
    fuel = fuel_score(f)
    total = _clamp(0.45 * behavior + 0.35 * route + 0.20 * fuel)
    return {
        "behavior": round(behavior, 1),
        "route": round(route, 1),
        "fuel": round(fuel, 1),
        "total": round(total, 1),
        "flagged": total >= flag_threshold,
    }


def _vector(f):
    return [
        f.get("avg_speed", 0.0),
        f.get("max_speed", 0.0),
        float(f.get("harsh_count", 0)),
        f.get("speed_ratio", 1.0),
        f.get("max_deviation_m") or 0.0,
        f.get("fuel_per_km") or 0.0,
    ]


class BehaviorAnomalyModel:
    """Unsupervised anomaly detector over the trip population.

    Returns a per-trip factor in [0, 1] (higher = more anomalous), used to nudge
    the behavior score. Falls back to a no-op when sklearn is unavailable or
    there are too few trips to fit meaningfully.
    """

    MIN_SAMPLES = 8

    def __init__(self):
        self._model = None

    def fit(self, feature_list):
        if not _HAS_SKLEARN or len(feature_list) < self.MIN_SAMPLES:
            self._model = None
            return self
        x = np.array([_vector(f) for f in feature_list], dtype=float)
        # Guard against zero-variance columns.
        std = x.std(axis=0)
        std[std == 0] = 1.0
        self._mean = x.mean(axis=0)
        self._std = std
        xn = (x - self._mean) / self._std
        self._model = IsolationForest(random_state=42, contamination="auto")
        self._model.fit(xn)
        return self

    def factor(self, f):
        if self._model is None:
            return 0.0
        xn = (np.array([_vector(f)], dtype=float) - self._mean) / self._std
        # decision_function: higher = normal. Map to [0,1] anomaly strength.
        score = float(self._model.decision_function(xn)[0])
        return float(max(0.0, min(1.0, 0.5 - score)))
