import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ActiveTripPanel from "../components/trips/ActiveTripPanel.jsx";
import RouteSimulationModal from "../components/trips/RouteSimulationModal.jsx";
import TripCompletionModal from "../components/trips/TripCompletionModal.jsx";
import TripRouteMap from "../components/trips/TripRouteMap.jsx";
import TripTimeline from "../components/trips/TripTimeline.jsx";
import { getRouteSimulationState, pauseRouteSimulation, resumeRouteSimulation, startRouteSimulation, stopRouteSimulation, subscribeToRouteSimulation } from "../services/routeSimulationService.js";
import { completeTrip, getTripById } from "../services/tripService.js";

function BackIcon(){return <svg className="trip-back-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/><path d="M10 12h10"/></svg>}

export default function TripDetails(){
 const{tripId}=useParams();const navigate=useNavigate();const[trip,setTrip]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[completeOpen,setCompleteOpen]=useState(false),[simulationOpen,setSimulationOpen]=useState(false),[simulation,setSimulation]=useState(getRouteSimulationState());
 const load=async()=>{setError("");try{setTrip(await getTripById(tripId))}catch(loadError){setError(loadError.message)}finally{setLoading(false)}};
 useEffect(()=>{load()},[tripId]);
 useEffect(()=>subscribeToRouteSimulation(next=>{setSimulation(previous=>{if(next.tripId===tripId&&next.current!==previous.current)load();return next})}),[tripId]);
 if(loading)return <LoadingState title="Loading trip" description="Retrieving trip details and telemetry from Supabase."/>;
 if(error)return <Card><EmptyState title="Trip is unavailable" description={error}/></Card>;
 if(!trip)return <Card><EmptyState title="Trip not found" description="The requested trip does not exist."/><div className="resource-error"><button className="button primary" onClick={()=>navigate("/trips")}>Return to Trips</button></div></Card>;
 const overview=[["Vehicle",trip.plateNumber],["Driver",trip.driverName],["Origin",trip.origin],["Destination",trip.destination],["Dispatch Time",trip.scheduledDeparture?new Date(trip.scheduledDeparture).toLocaleString():"Not recorded"],["Start Time",trip.actualDeparture?new Date(trip.actualDeparture).toLocaleString():"Not started"],["End Time",trip.actualArrival?new Date(trip.actualArrival).toLocaleString():"Not completed"],["Route Status",trip.routeStatus],["Risk Score",trip.riskScore],["Alerts",trip.alertCount],["Route Anomalies",trip.deviationCount],["Last Telemetry",trip.lastGpsUpdate]];
 const action=label=>{if(label==="View in Live Map")navigate("/live-fleet");else if(label==="Simulate Route")setSimulationOpen(true);else if(label==="Pause Simulation")pauseRouteSimulation();else if(label==="Resume Simulation")resumeRouteSimulation();else if(label==="Stop Simulation")stopRouteSimulation();else setCompleteOpen(true)};
 const start=config=>{startRouteSimulation(config);setSimulationOpen(false)};
 const finish=async()=>{if(simulation.tripId===trip.id)stopRouteSimulation();await completeTrip(trip.id);setCompleteOpen(false);await load()};
 return <div><PageHeader eyebrow="Trip Details" title={trip.tripCode} description={trip.purpose} actions={<div className="trip-title-status"><button className="button ghost trip-back-button" type="button" onClick={()=>navigate("/trips")} aria-label="Back to Trips and Routes"><BackIcon/>Back to Trips and Routes</button><StatusBadge status={trip.status}/><StatusBadge status={trip.routeStatus}/></div>}/><div className="trip-detail-grid"><Card title="Overview"><div className="trip-overview-grid">{overview.map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></Card><Card title="Safety Summary"><div className="trip-summary"><strong>{trip.riskScore}</strong><StatusBadge status={trip.riskLevel}/><span>{trip.alertCount} incident alerts</span><span>{trip.deviationCount} route anomalies</span></div></Card></div><Card title="Route Map"><TripRouteMap trip={trip}/></Card><div className="trip-detail-grid trip-detail-lower"><Card title="Timeline"><TripTimeline events={trip.timeline}/></Card><Card title="Database References"><div className="trip-alert-summary"><p>Trip ID</p><span>{trip.id}</span><p>Vehicle ID</p><span>{trip.vehicleId}</span><p>Driver ID</p><span>{trip.driverId}</span></div></Card></div><ActiveTripPanel trip={trip} simulation={simulation} onAction={action}/><TripCompletionModal trip={completeOpen?trip:null} onClose={()=>setCompleteOpen(false)} onConfirm={finish}/>{simulationOpen&&<RouteSimulationModal trip={trip} onClose={()=>setSimulationOpen(false)} onStart={start}/>}</div>;
}
