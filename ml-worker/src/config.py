"""Environment configuration for the NovaFleet ML worker."""
import os

from dotenv import load_dotenv

load_dotenv()


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            f"Copy ml-worker/.env.example to ml-worker/.env and fill it in."
        )
    return value


class Config:
    supabase_url = _require("SUPABASE_URL")
    supabase_service_role_key = _require("SUPABASE_SERVICE_ROLE_KEY")
    supabase_schema = os.environ.get("SUPABASE_SCHEMA", "fleet")

    route_deviation_threshold_m = float(os.environ.get("ROUTE_DEVIATION_THRESHOLD_M", "150"))
    risk_flag_threshold = float(os.environ.get("RISK_FLAG_THRESHOLD", "60"))
    min_readings = int(os.environ.get("MIN_READINGS", "3"))
    poll_interval_seconds = int(os.environ.get("POLL_INTERVAL_SECONDS", "60"))


config = Config()
