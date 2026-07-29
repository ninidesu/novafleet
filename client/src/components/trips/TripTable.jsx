import { useState } from "react";
import StatusBadge from "../StatusBadge.jsx";
import TablePagination, { usePagination } from "../TablePagination.jsx";

export default function TripTable({ trips, onAction, can }) {
  const [page, setPage] = useState(1);
  const pagination = usePagination(trips, page, setPage);
  const actions = (trip) => <div className="trip-actions"><button onClick={() => onAction("view", trip)}>View Details</button>{trip.status === "Dispatched" && can("edit") && <button onClick={() => onAction("edit", trip)}>Edit</button>}{trip.status === "Dispatched" && can("start") && <button onClick={() => onAction("start", trip)}>Start Trip</button>}{["Dispatched", "Active"].includes(trip.status) && can("cancel") && <button onClick={() => onAction("cancel", trip)}>Cancel</button>}{trip.status === "Active" && can("complete") && <button onClick={() => onAction("complete", trip)}>Complete Trip</button>}</div>;

  if (!trips.length) return <div className="empty-state"><div className="empty-state-title">No trips match these filters</div><div>Clear or adjust the filters to see trip records.</div></div>;

  return <>
    <div className="trip-table-wrap">
      <table className="data-table trip-table">
        <thead><tr><th>Trip ID</th><th>Vehicle</th><th>Driver</th><th>Origin</th><th>Destination</th><th>Dispatch Time</th><th>Status</th><th>Route Status</th><th>Alerts</th><th>Actions</th></tr></thead>
        <tbody>{pagination.pageItems.map((trip) => <tr key={trip.id}><td><strong title={trip.id}>{trip.tripCode}</strong><small>{trip.purpose}</small></td><td>{trip.plateNumber}</td><td>{trip.driverName}</td><td>{trip.origin}</td><td>{trip.destination}</td><td>{trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleString() : "Not recorded"}</td><td><StatusBadge status={trip.status} /></td><td><StatusBadge status={trip.routeStatus} /></td><td>{trip.alertCount}</td><td>{actions(trip)}</td></tr>)}</tbody>
      </table>
    </div>
    <div className="trip-mobile-list">{pagination.pageItems.map((trip) => <article className="trip-mobile-card" key={trip.id}><div><strong>{trip.tripCode}</strong><StatusBadge status={trip.status} /></div><h3>{trip.origin} to {trip.destination}</h3><p>{trip.plateNumber} · {trip.driverName}</p><p>{trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleString() : "Dispatch time not recorded"}</p>{actions(trip)}</article>)}</div>
    <TablePagination {...pagination} onPageChange={setPage} />
  </>;
}
