import { supabase } from "./supabase.js";
const SELECT="id,vehicle_id,maintenance_type,service_date,cost,notes,vehicle:vehicles!maintenance_records_vehicle_id_fkey(id,plate_number,model,status)";
const titleCase=value=>value?String(value).replace(/[_-]+/g," ").replace(/\b\w/g,l=>l.toUpperCase()):"Maintenance";
const currency=value=>value==null?"Not recorded":new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(Number(value));
function mapRecord(row){const today=new Date();today.setHours(0,0,0,0);const serviceDate=row.service_date?new Date(`${row.service_date}T00:00:00`):null;return{id:row.id,vehicleId:row.vehicle_id,vehicle:row.vehicle?.plate_number||"Unknown vehicle",vehicleModel:row.vehicle?.model||"",vehicleStatus:titleCase(row.vehicle?.status||"Unknown"),maintenanceType:titleCase(row.maintenance_type),serviceDateValue:row.service_date||"",serviceDate:serviceDate?serviceDate.toLocaleDateString():"Not recorded",scheduleStatus:serviceDate&&serviceDate>today?"Scheduled":"Recorded",costValue:row.cost??"",cost:currency(row.cost),notes:row.notes||""}}
function payload(values){return{vehicle_id:values.vehicleId,maintenance_type:values.maintenanceType.trim(),service_date:values.serviceDate,cost:values.cost===""?null:Number(values.cost),notes:values.notes.trim()||null}}
function check(error){if(!error)return;if(error.code==="23503")throw new Error("The selected vehicle no longer exists.");throw error}
export async function listMaintenanceRecords(){const{data,error}=await supabase.from("maintenance_records").select(SELECT).order("service_date",{ascending:false});check(error);return(data||[]).map(mapRecord)}
export async function listMaintenanceVehicles(){const{data,error}=await supabase.from("vehicles").select("id,plate_number,model,status").order("plate_number");check(error);return data||[]}
export async function createMaintenanceRecord(values){const{error}=await supabase.from("maintenance_records").insert(payload(values));check(error)}
export async function updateMaintenanceRecord(id,values){const{error}=await supabase.from("maintenance_records").update(payload(values)).eq("id",id);check(error)}
export async function removeMaintenanceRecord(id){const{error}=await supabase.from("maintenance_records").delete().eq("id",id);check(error)}
export function subscribeToMaintenance(onChange){const channel=supabase.channel("admin-maintenance").on("postgres_changes",{event:"*",schema:"fleet",table:"maintenance_records"},onChange).subscribe();return()=>supabase.removeChannel(channel)}
