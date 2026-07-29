import { useCallback } from "react";
import useFleetResource from "../hooks/useFleetResource.js";
import { getRouteAnomalies } from "../services/fleetResourceService.js";
import TablePage from "./TablePage.jsx";

export default function RouteDeviations() {
  const loader = useCallback(() => getRouteAnomalies(), []);
  const { data, loading, error, reload } = useFleetResource(loader);
  const columns = [
    { key: "tripId", header: "Trip ID", render: (row) => <span title={row.tripId}>{row.tripId.slice(0,8)}</span> }, { key: "vehicle", header: "Vehicle" },
    { key: "driver", header: "Driver" }, { key: "detectedTime", header: "Flagged At" }, { key: "deviationDistance", header: "Maximum Deviation" }, { key: "duration", header: "Duration" },
  ];
  return <TablePage eyebrow="Monitoring" title="Route Deviations" description="Route anomalies measured against planned trip paths." searchPlaceholder="Search trip, vehicle, or driver..." rows={data} columns={columns} filterKeys={["tripId","vehicle","driver","detectedTime"]} loading={loading} error={error} onRetry={reload} />;
}