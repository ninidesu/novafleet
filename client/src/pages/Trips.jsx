import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Button from "../components/Button.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import LoadingState from "../components/LoadingState.jsx";
import TripFilters from "../components/trips/TripFilters.jsx";
import TripTable from "../components/trips/TripTable.jsx";
import TripCompletionModal from "../components/trips/TripCompletionModal.jsx";
import { canPerformTripAction } from "../config/roles.js";
import { getSession } from "../services/authService.js";
import { cancelTrip, completeTrip, getTrips, startTrip, subscribeToTrips } from "../services/tripService.js";

const emptyFilters = { search:"", date:"", vehicle:"", driver:"", routeStatus:"" };
export default function Trips() {
  const navigate = useNavigate(); const { globalSearch = "" } = useOutletContext() || {}; const role = getSession()?.role || "dispatcher";
  const [trips,setTrips] = useState([]); const [loading,setLoading] = useState(true); const [error,setError] = useState(""); const [status,setStatus] = useState("All"); const [filters,setFilters] = useState(emptyFilters); const [completionTrip,setCompletionTrip] = useState(null);
  const reload = useCallback(async () => { setError(""); try { setTrips(await getTrips()); } catch (loadError) { setError(loadError.message); } finally { setLoading(false); } }, []);
  useEffect(() => { reload(); return subscribeToTrips(reload); }, [reload]);
  const filtered = useMemo(() => trips.filter((trip) => { const q=(globalSearch||filters.search).toLowerCase(); return (status==="All"||trip.status===status)&&(!q||[trip.tripCode,trip.plateNumber,trip.driverName,trip.origin,trip.destination].some((value)=>value.toLowerCase().includes(q)))&&(!filters.date||trip.scheduledDeparture?.startsWith(filters.date))&&(!filters.vehicle||trip.plateNumber===filters.vehicle)&&(!filters.driver||trip.driverName===filters.driver)&&(!filters.routeStatus||trip.routeStatus===filters.routeStatus); }), [trips,status,filters,globalSearch]);
  const action = async (name,trip) => { if(name==="view") return navigate(`/trips/${trip.id}`); if(name==="edit") return navigate(`/trips/${trip.id}/edit`); if(name==="cancel"&&window.confirm("Cancel this trip?")) await cancelTrip(trip.id); if(name==="start"&&window.confirm("Start this trip?")) await startTrip(trip.id); if(name==="complete") return setCompletionTrip(trip); await reload(); };
  const counts = (value) => trips.filter((trip) => trip.status===value).length;
  if (loading) return <LoadingState title="Loading trips" description="Retrieving trip assignments from Supabase." />;
  return <div><PageHeader eyebrow="Fleet Operations" title="Trips and Routes" description="Dispatch and monitor trips stored in the fleet database." actions={canPerformTripAction(role,"create")&&<Button onClick={()=>navigate("/trips/new")}>Add Trip</Button>}/>{error&&<div className="dashboard-inline-error" role="alert">{error}</div>}<div className="grid trip-kpis"><MetricCard label="Dispatched" value={counts("Dispatched")} meta="Awaiting trip start"/><MetricCard label="Active" value={counts("Active")} meta="Currently monitored"/><MetricCard label="Completed" value={counts("Completed")} meta="Finished trips"/><MetricCard label="Route Anomalies" value={trips.reduce((sum,trip)=>sum+trip.deviationCount,0)} meta="Recorded deviations"/></div><div className="card trips-workspace"><div className="trip-tabs">{["All","Dispatched","Active","Completed","Cancelled"].map((tab)=><button className={status===tab?"active":""} key={tab} onClick={()=>setStatus(tab)}>{tab}</button>)}</div><TripFilters filters={filters} onChange={(name,value)=>setFilters((current)=>({...current,[name]:value}))} onClear={()=>setFilters(emptyFilters)} vehicles={[...new Set(trips.map((trip)=>trip.plateNumber))]} drivers={[...new Set(trips.map((trip)=>trip.driverName))]}/><div className="trip-result-count">{filtered.length} trip results</div><TripTable trips={filtered} onAction={action} can={(name)=>canPerformTripAction(role,name)}/></div><TripCompletionModal trip={completionTrip} onClose={()=>setCompletionTrip(null)} onConfirm={async()=>{await completeTrip(completionTrip.id);setCompletionTrip(null);await reload();}}/></div>;
}