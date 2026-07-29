import { useCallback } from "react";
import StatusBadge from "../components/StatusBadge.jsx";
import useFleetResource from "../hooks/useFleetResource.js";
import { getRiskScores } from "../services/fleetResourceService.js";
import TablePage from "./TablePage.jsx";

export default function RiskMonitoring() {
  const loader = useCallback(() => getRiskScores(), []);
  const { data, loading, error, reload } = useFleetResource(loader);
  const columns = [
    { key: "tripId", header: "Trip ID", render: (row) => <span title={row.tripId}>{row.tripId.slice(0,8)}</span> }, { key: "driver", header: "Driver" }, { key: "vehicle", header: "Vehicle" },
    { key: "score", header: "Total Score" }, { key: "riskLevel", header: "Risk Level", render: (row) => <StatusBadge status={row.riskLevel} /> },
    { key: "behaviorScore", header: "Behavior" }, { key: "routeScore", header: "Route" }, { key: "fuelScore", header: "Fuel" }, { key: "reviewStatus", header: "Review", render: (row) => <StatusBadge status={row.reviewStatus} /> },
  ];
  return <TablePage eyebrow="Monitoring" title="Risk Monitoring" description="Trip-level behavioral, route, and fuel anomaly scoring." searchPlaceholder="Search trip, driver, vehicle, or review status..." rows={data} columns={columns} filterKeys={["tripId","driver","vehicle","riskLevel","reviewStatus"]} loading={loading} error={error} onRetry={reload} />;
}