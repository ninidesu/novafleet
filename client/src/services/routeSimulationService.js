import { supabase } from "./supabase.js";

let state={status:"idle",tripId:null,current:0,total:0,error:""};
let timer=null;let configuration=null;const listeners=new Set();
const publish=()=>listeners.forEach(listener=>listener({...state}));

function createRoute(start,destination,total=18){
 const latDelta=destination[0]-start[0],lngDelta=destination[1]-start[1];
 const length=Math.hypot(latDelta,lngDelta)||1;const normalLat=-lngDelta/length,normalLng=latDelta/length;
 return Array.from({length:total},(_,index)=>{const t=index/(total-1);const curve=Math.sin(Math.PI*t)*Math.min(length*.12,.0015);return[start[0]+latDelta*t+normalLat*curve,start[1]+lngDelta*t+normalLng*curve]});
}
async function writeNext(){
 if(!configuration||state.status!=="running")return;
 const point=configuration.route[state.current];
 const{error}=await supabase.from("sensor_readings").insert({trip_id:configuration.tripId,recorded_at:new Date().toISOString(),lat:point[0],lng:point[1],speed_kmh:configuration.speed,source:"simulator"});
 if(error){clearInterval(timer);timer=null;state={...state,status:"error",error:error.message};publish();return}
 state={...state,current:state.current+1};publish();
 if(state.current>=state.total){clearInterval(timer);timer=null;state={...state,status:"completed"};publish()}
}
export function startRouteSimulation({tripId,start,destination,interval,speed}){
 stopRouteSimulation(false);const route=createRoute(start,destination);configuration={tripId,route,interval,speed};state={status:"running",tripId,current:0,total:route.length,error:""};publish();writeNext();timer=setInterval(writeNext,interval);return{...state};
}
export function pauseRouteSimulation(){if(state.status!=="running")return;clearInterval(timer);timer=null;state={...state,status:"paused"};publish()}
export function resumeRouteSimulation(){if(state.status!=="paused"||!configuration)return;state={...state,status:"running"};publish();writeNext();timer=setInterval(writeNext,configuration.interval)}
export function stopRouteSimulation(notify=true){if(timer)clearInterval(timer);timer=null;configuration=null;state={status:"idle",tripId:null,current:0,total:0,error:""};if(notify)publish()}
export function getRouteSimulationState(){return{...state}}
export function subscribeToRouteSimulation(listener){listeners.add(listener);listener({...state});return()=>listeners.delete(listener)}
