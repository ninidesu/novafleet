import { useCallback, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Card from "../components/Card.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import useFleetResource from "../hooks/useFleetResource.js";
import { getRiskScores, getRouteAnomalies } from "../services/fleetResourceService.js";

const deviationColumns = [
  { key: "tripId", header: "Trip ID", render: (row) => <span title={row.tripId}>{row.tripId.slice(0, 8)}</span> },
  { key: "vehicle", header: "Vehicle" }, { key: "driver", header: "Driver" }, { key: "detectedTime", header: "Flagged At" },
  { key: "deviationDistance", header: "Maximum Deviation" }, { key: "duration", header: "Duration" },
];
const riskColumns = [
  { key: "tripId", header: "Trip ID", render: (row) => <span title={row.tripId}>{row.tripId.slice(0, 8)}</span> },
  { key: "driver", header: "Driver" }, { key: "vehicle", header: "Vehicle" }, { key: "score", header: "Total Score" },
  { key: "riskLevel", header: "Risk Level", render: (row) => <StatusBadge status={row.riskLevel} /> },
  { key: "behaviorScore", header: "Behavior" }, { key: "routeScore", header: "Route" }, { key: "fuelScore", header: "Fuel" },
  { key: "reviewStatus", header: "Review", render: (row) => <StatusBadge status={row.reviewStatus} /> },
];

export default function RouteRiskMonitoring() {
  const { globalSearch = "" } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState("deviations");
  const loader = useCallback(async () => { const [deviations, risks] = await Promise.all([getRouteAnomalies(), getRiskScores()]); return { deviations, risks }; }, []);
  const { data, loading, error, reload } = useFleetResource(loader);
  const deviations = data?.deviations || [];
  const risks = data?.risks || [];
  const activeRows = activeTab === "deviations" ? deviations : risks;
  const filteredRows = useMemo(() => {
    const term = globalSearch.trim().toLowerCase();
    if (!term) return activeRows;
    return activeRows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [activeRows, globalSearch]);
  const highRisk = risks.filter((row) => ["High", "Critical"].includes(row.riskLevel)).length;
  const pendingReview = risks.filter((row) => row.reviewStatus === "Pending").length;

  return <div className="route-risk-page">
    <PageHeader eyebrow="Monitoring" title="Route & Risk Monitoring" />
    {loading ? <LoadingState title="Loading monitoring data" description="Retrieving route anomalies and trip risk assessments." /> : error ? <Card><EmptyState title="Monitoring data is unavailable" description={error} /><div className="resource-error"><button className="button primary" onClick={reload}>Try again</button></div></Card> : <>
      <div className="grid route-risk-metrics"><MetricCard label="Route Deviations" value={deviations.length} meta="Recorded route anomalies" /><MetricCard label="Risk Assessments" value={risks.length} meta="Scored fleet trips" /><MetricCard label="High-Risk Trips" value={highRisk} meta="High or critical risk" /><MetricCard label="Pending Review" value={pendingReview} meta="Assessments awaiting review" /></div>
      <Card className="route-risk-workspace">
        <div className="route-risk-tabs" role="tablist" aria-label="Route and risk monitoring views"><button type="button" role="tab" aria-selected={activeTab === "deviations"} className={activeTab === "deviations" ? "active" : ""} onClick={() => setActiveTab("deviations")}>Route Deviations <span>{deviations.length}</span></button><button type="button" role="tab" aria-selected={activeTab === "risks"} className={activeTab === "risks" ? "active" : ""} onClick={() => setActiveTab("risks")}>Risk Scores <span>{risks.length}</span></button></div>
        <div className="route-risk-table-heading"><div><strong>{activeTab === "deviations" ? "Route deviation records" : "Trip risk assessments"}</strong><span>{globalSearch ? `${filteredRows.length} matching records` : `${activeRows.length} records`}</span></div></div>
        <DataTable columns={activeTab === "deviations" ? deviationColumns : riskColumns} rows={filteredRows} emptyTitle={globalSearch ? "No matching monitoring records" : activeTab === "deviations" ? "No route deviations" : "No risk assessments"} emptyDescription={globalSearch ? "Clear the top search field and try again." : "Records will appear when monitoring data is available."} />
      </Card>
    </>}
  </div>;
}
