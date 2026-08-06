"""CLI entrypoint for the NovaFleet ML worker.

  python src/main.py               # score all trips once
  python src/main.py --trip <id>   # score a single trip
  python src/main.py --loop        # score continuously (POLL_INTERVAL_SECONDS)
"""
import argparse
import logging
import time

from config import config
from worker import run_once


def main():
    parser = argparse.ArgumentParser(description="NovaFleet ML worker (risk scoring + route anomalies)")
    parser.add_argument("--trip", help="Score only this trip id", default=None)
    parser.add_argument("--loop", action="store_true", help="Run continuously")
    parser.add_argument("--interval", type=int, default=config.poll_interval_seconds, help="Loop interval seconds")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    log = logging.getLogger("novafleet.ml")

    if not args.loop:
        run_once(args.trip)
        return

    log.info("Starting ML worker loop (interval=%ss). Ctrl+C to stop.", args.interval)
    while True:
        try:
            run_once(args.trip)
        except Exception as exc:  # noqa: BLE001 - keep the loop alive
            log.error("Run failed: %s", exc)
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
