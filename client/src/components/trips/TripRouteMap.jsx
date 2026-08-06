import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import EmptyState from "../EmptyState.jsx";
import { routeLayerStyles } from "../maps/routeLayers.js";
const icon=(color,label)=>L.divIcon({className:"trip-map-icon-wrap",html:`<span class="trip-map-icon" style="background:${color}">${label}</span>`,iconSize:[28,28],iconAnchor:[14,14]});
export default function TripRouteMap({trip}) {
  if(!trip.originCoordinates||!trip.destinationCoordinates)return <EmptyState title="No route geometry" description="Add a planned route or sensor readings to display this trip on the map."/>;
  const current=trip.actualRoute?.at(-1);
  return <div className="trip-route-map"><MapContainer center={trip.originCoordinates} zoom={12} scrollWheelZoom><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" maxZoom={20}/><Marker position={trip.originCoordinates} icon={icon("#64748B","O")}/><Marker position={trip.destinationCoordinates} icon={icon("#0B1F3A","D")}/>{current&&trip.status==="Active"&&<Marker position={current} icon={icon("#2E6BE6","V")}/>} {trip.plannedRoute?.length>1&&<Polyline positions={trip.plannedRoute} pathOptions={routeLayerStyles.planned}/>} {trip.actualRoute?.length>1&&<Polyline positions={trip.actualRoute} pathOptions={routeLayerStyles.actual}/>}</MapContainer><div className="trip-map-legend"><span>Planned Route</span><span>Recorded Route</span><span>Current Location</span></div></div>;
}