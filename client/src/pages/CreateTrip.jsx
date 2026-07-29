import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import TripForm from "../components/trips/TripForm.jsx";
import { createTrip, getTripById, getTripOptions, updateTrip } from "../services/tripService.js";

export default function CreateTrip() {
  const navigate=useNavigate(); const {tripId}=useParams(); const [existing,setExisting]=useState(null); const [options,setOptions]=useState({vehicles:[],drivers:[]}); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  useEffect(()=>{Promise.all([getTripOptions(),tripId?getTripById(tripId):Promise.resolve(null)]).then(([nextOptions,trip])=>{setOptions(nextOptions);setExisting(trip);}).catch((loadError)=>setError(loadError.message)).finally(()=>setLoading(false));},[tripId]);
  if(loading)return <LoadingState title="Loading trip form" description="Retrieving available vehicles and drivers."/>;
  if(error)return <Card><EmptyState title="Trip form is unavailable" description={error}/></Card>;
  if(tripId&&!existing)return <Card><EmptyState title="Trip not found" description="The requested trip does not exist."/></Card>;
  const save=async(values)=>{const trip=existing?await updateTrip(existing.id,values):await createTrip(values);navigate(`/trips/${trip.id}`);};
  return <div><PageHeader eyebrow="Trips and Routes" title={existing?`Edit ${existing.tripCode}`:"Create Trip"} description="Assign a database vehicle and driver to a fleet operation."/><TripForm initialTrip={existing} vehicles={options.vehicles} drivers={options.drivers} onCancel={()=>navigate("/trips")} onSubmit={save}/></div>;
}