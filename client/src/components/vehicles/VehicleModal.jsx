import { useEffect, useState } from "react";
import Button from "../Button.jsx";
import Input from "../Input.jsx";
import Select from "../Select.jsx";
import StatusBadge from "../StatusBadge.jsx";

const blank={plateNumber:"",vehicleType:"",model:"",status:"Active",assignedDriverId:"",fuelCapacity:"",odometer:""};
const date=(value)=>value?new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(new Date(value)):"Not recorded";
export default function VehicleModal({mode,vehicle,drivers,busy,error,onClose,onSave,onEdit,onDeactivate,onRemove}){
 const editing=mode==="create"||mode==="edit";const[values,setValues]=useState(blank);const[errors,setErrors]=useState({});
 useEffect(()=>{setValues(vehicle?{...blank,plateNumber:vehicle.plateNumber,vehicleType:vehicle.vehicleType==="Not specified"?"":vehicle.vehicleType,model:vehicle.model==="Not specified"?"":vehicle.model,status:vehicle.status,assignedDriverId:vehicle.assignedDriverId,fuelCapacity:vehicle.fuelCapacityValue,odometer:vehicle.odometerValue}:blank);setErrors({})},[vehicle,mode]);
 useEffect(()=>{const handler=e=>{if(e.key==="Escape"&&!busy)onClose()};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler)},[busy,onClose]);
 const set=(field)=>(event)=>setValues(current=>({...current,[field]:event.target.value}));
 const submit=(event)=>{event.preventDefault();const next={};if(!values.plateNumber.trim())next.plateNumber="Plate number is required.";if(!values.vehicleType.trim())next.vehicleType="Vehicle type is required.";if(!values.model.trim())next.model="Model is required.";if(values.fuelCapacity!==""&&Number(values.fuelCapacity)<0)next.fuelCapacity="Enter zero or a positive value.";if(values.odometer!==""&&Number(values.odometer)<0)next.odometer="Enter zero or a positive value.";setErrors(next);if(!Object.keys(next).length)onSave(values)};
 const title=mode==="create"?"Add vehicle":mode==="edit"?"Edit vehicle":vehicle?.plateNumber;
 return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose()}}><section className="device-modal vehicle-modal" role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title">
  <div className="device-modal-header"><div><span className="page-eyebrow">Fleet vehicle</span><h2 id="vehicle-modal-title">{title}</h2></div><button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
  {error&&<div className="device-form-error" role="alert">{error}</div>}
  {editing?<form onSubmit={submit}><div className="device-form-grid vehicle-form-grid">
   <div><Input id="vehicle-plate" label="Plate number" value={values.plateNumber} onChange={set("plateNumber")} disabled={busy} aria-invalid={Boolean(errors.plateNumber)}/>{errors.plateNumber&&<span className="field-error">{errors.plateNumber}</span>}</div>
   <div><Input id="vehicle-model" label="Model" value={values.model} onChange={set("model")} disabled={busy} aria-invalid={Boolean(errors.model)}/>{errors.model&&<span className="field-error">{errors.model}</span>}</div>
   <div><Input id="vehicle-type" label="Vehicle type" value={values.vehicleType} onChange={set("vehicleType")} disabled={busy} placeholder="Van, truck, motorcycle..." aria-invalid={Boolean(errors.vehicleType)}/>{errors.vehicleType&&<span className="field-error">{errors.vehicleType}</span>}</div>
   <Select id="vehicle-status" label="Operational status" value={values.status} onChange={set("status")} disabled={busy}><option>Active</option><option>In Service</option><option>Maintenance</option><option>Inactive</option></Select>
   <Select id="vehicle-driver" label="Assigned driver" value={values.assignedDriverId} onChange={set("assignedDriverId")} disabled={busy}><option value="">Unassigned</option>{drivers.map(driver=><option key={driver.id} value={driver.id}>{driver.full_name} - {driver.status}</option>)}</Select>
   <div><Input id="vehicle-fuel" label="Fuel capacity (liters)" type="number" min="0" step="0.1" value={values.fuelCapacity} onChange={set("fuelCapacity")} disabled={busy}/>{errors.fuelCapacity&&<span className="field-error">{errors.fuelCapacity}</span>}</div>
   <div><Input id="vehicle-odometer" label="Odometer (km)" type="number" min="0" step="0.1" value={values.odometer} onChange={set("odometer")} disabled={busy}/>{errors.odometer&&<span className="field-error">{errors.odometer}</span>}</div>
  </div><div className="device-modal-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy?"Saving...":mode==="create"?"Add vehicle":"Save changes"}</Button></div></form>:<>
   <div className="device-detail-hero"><div><strong>{vehicle.model}</strong><span>{vehicle.vehicleType}</span></div><StatusBadge status={vehicle.status}/></div>
   <dl className="device-details"><div><dt>Assigned driver</dt><dd>{vehicle.assignedDriver}</dd></div><div><dt>Odometer</dt><dd>{vehicle.odometer}</dd></div><div><dt>Fuel capacity</dt><dd>{vehicle.fuelCapacity}</dd></div><div><dt>Added to fleet</dt><dd>{date(vehicle.createdAt)}</dd></div></dl>
   <div className="vehicle-management-note">Deactivate vehicles that should remain in operational history. Permanent removal is only available when no trips, maintenance, fuel, alerts, or devices reference the vehicle.</div>
   <div className="device-modal-actions split"><div className="vehicle-danger-actions"><Button type="button" variant="danger" onClick={onRemove} disabled={busy}>{busy?"Working...":"Remove"}</Button>{vehicle.status!=="Inactive"&&<Button type="button" variant="secondary" onClick={onDeactivate} disabled={busy}>Set inactive</Button>}</div><div><Button type="button" variant="secondary" onClick={onClose}>Close</Button><Button type="button" onClick={onEdit}>Edit vehicle</Button></div></div>
  </>}
 </section></div>
}
