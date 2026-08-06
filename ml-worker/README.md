# NovaFleet ML Worker

Python service that turns raw trip telemetry into the two analytics signals in the architecture: **risk scores** and **route anomalies**. It reads from Supabase and writes back to `fleet.risk_scores` and `fleet.route_anomalies` — the same tables the web app's **Route & Risk Monitoring** page and dashboard read from.

```
sensor_readings ─┐
trips ───────────┤
driver_baseline ─┼──▶  ML worker  ──▶  risk_scores
incident_alerts ─┤                      route_anomalies
fuel_logs ───────┘
```

## What it computes

**Route anomaly detection** (geometry): for each GPS reading, the shortest distance to the trip's `planned_route_polyline`. If the max deviation exceeds `ROUTE_DEVIATION_THRESHOLD_M`, it records a `route_anomalies` row with the max deviation and off-route duration.

**Risk scoring** (feature-based + anomaly detection): per trip it builds features — speed vs the driver's baseline, harsh-acceleration events, max deviation, fuel-per-km — and produces four 0-100 scores:

| Score | Driven by |
| --- | --- |
| `behavior_anomaly_score` | harsh events, speeding vs baseline, acceleration spikes, IsolationForest outlier signal |
| `route_deviation_score` | max deviation + time off route |
| `fuel_ratio_anomaly_score` | fuel consumed per km |
| `total_risk_score` | weighted blend; `flagged` when ≥ `RISK_FLAG_THRESHOLD` |

An **IsolationForest** (scikit-learn) is fit over the trip population to flag drivers/trips that are statistical outliers, layered onto the behavior score. When there are too few trips it gracefully falls back to the rule-based signal.

> This is a transparent v1. `src/scoring.py` is the seam: a trained model can replace `compute_scores` / `BehaviorAnomalyModel` later without changing the worker or DB code.

## Setup

```bash
cd ml-worker
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
```

Use the **same** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as `server/.env`. The `fleet` schema must be exposed in the Supabase Data API (already configured for this project).

## Run

```bash
python src/main.py                 # score all trips once
python src/main.py --trip <uuid>   # score a single trip
python src/main.py --loop          # run continuously (POLL_INTERVAL_SECONDS)
```

After a run, open the web app's **Route & Risk Monitoring** page — the scores and anomalies you see are now computed from real telemetry.

## Notes
- Idempotent: re-running replaces the worker's `risk_scores` / `route_anomalies` for each trip, so it's safe to run repeatedly (it will recompute over the seeded demo values).
- Only trips with at least `MIN_READINGS` GPS points are scored.
