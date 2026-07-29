import { useCallback, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Input from "../components/Input.jsx";
import LoadingState from "../components/LoadingState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import useFleetResource from "../hooks/useFleetResource.js";
import { getOperationalReports } from "../services/reportService.js";

const REPORTS = {
  trips: { label: "Trips", columns: [{ key: "tripCode", header: "Trip ID" }, { key: "vehicle", header: "Vehicle" }, { key: "driver", header: "Driver" }, { key: "origin", header: "Origin" }, { key: "destination", header: "Destination" }, { key: "dispatchTime", header: "Dispatched" }, { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> }] },
  vehicles: { label: "Vehicles", columns: [{ key: "plateNumber", header: "Plate Number" }, { key: "model", header: "Model" }, { key: "vehicleType", header: "Type" }, { key: "assignedDriver", header: "Assigned Driver" }, { key: "odometer", header: "Odometer" }, { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> }] },
  drivers: { label: "Drivers", columns: [{ key: "name", header: "Driver" }, { key: "licenseNumber", header: "License" }, { key: "contactNumber", header: "Contact" }, { key: "assignedVehicle", header: "Assigned Vehicle" }, { key: "createdAt", header: "Registered" }, { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> }] },
  safety: { label: "Safety Alerts", columns: [{ key: "triggeredAt", header: "Triggered" }, { key: "vehicle", header: "Vehicle" }, { key: "tripId", header: "Trip ID" }, { key: "alertType", header: "Alert Type" }, { key: "acceleration", header: "Acceleration" }, { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> }] },
  maintenance: { label: "Maintenance", columns: [{ key: "serviceDate", header: "Service Date" }, { key: "vehicle", header: "Vehicle" }, { key: "maintenanceType", header: "Maintenance Type" }, { key: "cost", header: "Cost" }, { key: "notes", header: "Notes" }] },
};

function csvValue(value) { return String.fromCharCode(34) + String(value ?? "").replaceAll(String.fromCharCode(34), String.fromCharCode(34, 34)) + String.fromCharCode(34); }
function exportCsv(label, columns, rows) {
  const headers = columns.map((column) => csvValue(column.header)).join(",");
  const body = rows.map((row) => columns.map((column) => csvValue(row[column.key])).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${headers}\r\n${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `novafleet-${label.toLowerCase().replaceAll(" ", "-")}-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { globalSearch = "" } = useOutletContext() || {};
  const [activeReport, setActiveReport] = useState("trips");
  const [query, setQuery] = useState("");
  const loader = useCallback(() => getOperationalReports(), []);
  const { data, loading, error, reload } = useFleetResource(loader);
  const report = REPORTS[activeReport];
  const rows = data?.[activeReport] || [];
  const filteredRows = useMemo(() => {
    const term = (globalSearch || query).trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [globalSearch, query, rows]);

  return <div className="reports-page">
    <PageHeader eyebrow="Management" title="Reports" actions={<div className="report-actions"><Button variant="secondary" onClick={() => window.print()} disabled={loading || !filteredRows.length}>Print</Button><Button onClick={() => exportCsv(report.label, report.columns, filteredRows)} disabled={loading || !filteredRows.length}>Export CSV</Button></div>} />
    <Card className="report-workspace">
      <div className="report-tabs" role="tablist" aria-label="Operational reports">{Object.entries(REPORTS).map(([key, item]) => <button type="button" role="tab" aria-selected={activeReport === key} className={activeReport === key ? "active" : ""} key={key} onClick={() => { setActiveReport(key); setQuery(""); }}>{item.label}<span>{data?.[key]?.length || 0}</span></button>)}</div>
      {loading ? <LoadingState title="Loading reports" description="Retrieving operational records." /> : error ? <div className="resource-error" role="alert"><EmptyState title="Reports are unavailable" description={error} /><Button onClick={reload}>Try again</Button></div> : <>
        <div className="report-toolbar"><Input id="report-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${report.label.toLowerCase()}...`} aria-label={`Search ${report.label}`} /><div><strong>{filteredRows.length}</strong><span> records</span></div></div>
        <div className="report-print-heading"><h2>NovaFleet — {report.label} Report</h2><p>Generated {new Date().toLocaleString()}</p></div>
        <DataTable columns={report.columns} rows={filteredRows} emptyTitle={`No ${report.label.toLowerCase()} found`} emptyDescription="Clear the search field or select another report." />
      </>}
    </Card>
  </div>;
}
