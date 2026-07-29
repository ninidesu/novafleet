import { useEffect, useMemo, useState } from "react";
import Button from "../Button.jsx";
import Input from "../Input.jsx";
import Select from "../Select.jsx";

const DEFAULT_START=[14.6507,121.0494];
function fallbackDestination([lat,lng]){return[lat+.012,lng+.016]}
export default function RouteSimulationModal({trip,onClose,onStart}){
 const initial=useMemo(()=>{const start=trip.actualRoute?.at(-1)||trip.plannedRoute?.[0]||DEFAULT_START;const destination=trip.plannedRoute?.at(-1)||fallbackDestination(start);return{startLat:String(start[0]),startLng:String(start[1]),endLat:String(destination[0]),endLng:String(destination[1]),pace:"normal",speed:"35"}},[trip]);
 const[values,setValues]=useState(initial);const[error,setError]=useState("");
 useEffect(()=>{const handler=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler)},[onClose]);
 const set=field=>event=>setValues(current=>({...current,[field]:event.target.value}));
 const submit=event=>{event.preventDefault();const coordinates=[values.startLat,values.startLng,values.endLat,values.endLng].map(Number);if(coordinates.some(value=>!Number.isFinite(value))){setError("Enter valid numeric coordinates.");return}const[startLat,startLng,endLat,endLng]=coordinates;if(Math.abs(startLat)>90||Math.abs(endLat)>90||Math.abs(startLng)>180||Math.abs(endLng)>180){setError("Coordinates are outside valid latitude or longitude ranges.");return}const intervals={slow:3000,normal:1500,fast:700};onStart({tripId:trip.id,start:[startLat,startLng],destination:[endLat,endLng],interval:intervals[values.pace],speed:Number(values.speed)})};
 return <div className="modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className="device-modal simulation-modal" role="dialog" aria-modal="true" aria-labelledby="simulation-modal-title">
  <div className="device-modal-header"><div><span className="page-eyebrow">Indoor testing</span><h2 id="simulation-modal-title">Simulate route</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  <form onSubmit={submit}><div className="simulation-notice"><strong>Test data only</strong><span>Generated readings will be saved with source: simulator and remain attached to this trip.</span></div>{error&&<div className="device-form-error" role="alert">{error}</div>}<div className="device-form-grid">
   <Input id="sim-start-lat" label="Start latitude" type="number" step="any" value={values.startLat} onChange={set("startLat")}/><Input id="sim-start-lng" label="Start longitude" type="number" step="any" value={values.startLng} onChange={set("startLng")}/>
   <Input id="sim-end-lat" label="Destination latitude" type="number" step="any" value={values.endLat} onChange={set("endLat")}/><Input id="sim-end-lng" label="Destination longitude" type="number" step="any" value={values.endLng} onChange={set("endLng")}/>
   <Select id="sim-pace" label="Simulation pace" value={values.pace} onChange={set("pace")}><option value="slow">Slow - about 50 seconds</option><option value="normal">Normal - about 25 seconds</option><option value="fast">Fast - about 12 seconds</option></Select><Input id="sim-speed" label="Displayed speed (km/h)" type="number" min="0" max="160" value={values.speed} onChange={set("speed")}/>
  </div><div className="device-modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Start simulation</Button></div></form>
 </section></div>
}
