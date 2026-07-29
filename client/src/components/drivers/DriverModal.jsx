import { useEffect, useState } from "react";
import Button from "../Button.jsx";
import Input from "../Input.jsx";
import Select from "../Select.jsx";
import StatusBadge from "../StatusBadge.jsx";
const blank={name:"",licenseNumber:"",contactNumber:"",status:"Active",assignedVehicleId:""};
const date=value=>value?new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(new Date(value)):"Not recorded";
export default function DriverModal({mode,driver,vehicles,busy,error,onClose,onSave,onEdit,onDeactivate,onRemove}){
 const editing=mode==="create"||mode==="edit";const[values,setValues]=useState(blank);const[errors,setErrors]=useState({});
 useEffect(()=>{setValues(driver?{...blank,name:driver.name,licenseNumber:driver.licenseNumber==="Not recorded"?"":driver.licenseNumber,contactNumber:driver.contactNumber==="Not recorded"?"":driver.contactNumber,status:driver.status,assignedVehicleId:driver.assignedVehicleId}:blank);setErrors({})},[driver,mode]);
 useEffect(()=>{const handler=e=>{if(e.key==="Escape"&&!busy)onClose()};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler)},[busy,onClose]);
 const set=field=>event=>setValues(current=>({...current,[field]:event.target.value}));
 const submit=event=>{event.preventDefault();const next={};if(!values.name.trim())next.name="Full name is required.";if(!values.licenseNumber.trim())next.licenseNumber="License number is required.";setErrors(next);if(!Object.keys(next).length)onSave(values)};
 const title=mode==="create"?"Add driver":mode==="edit"?"Edit driver":driver?.name;
 return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose()}}><section className="device-modal driver-modal" role="dialog" aria-modal="true" aria-labelledby="driver-modal-title">
  <div className="device-modal-header"><div><span className="page-eyebrow">Fleet driver</span><h2 id="driver-modal-title">{title}</h2></div><button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
  {error&&<div className="device-form-error" role="alert">{error}</div>}
  {editing?<form onSubmit={submit}><div className="device-form-grid driver-form-grid">
   <div className="form-wide"><Input id="driver-name" label="Full name" value={values.name} onChange={set("name")} disabled={busy} aria-invalid={Boolean(errors.name)}/>{errors.name&&<span className="field-error">{errors.name}</span>}</div>
   <div><Input id="driver-license" label="License number" value={values.licenseNumber} onChange={set("licenseNumber")} disabled={busy} aria-invalid={Boolean(errors.licenseNumber)}/>{errors.licenseNumber&&<span className="field-error">{errors.licenseNumber}</span>}</div>
   <Input id="driver-contact" label="Contact number" type="tel" value={values.contactNumber} onChange={set("contactNumber")} disabled={busy}/>
   <Select id="driver-status" label="Driver status" value={values.status} onChange={set("status")} disabled={busy}><option>Active</option><option>Inactive</option><option>On Leave</option><option>Suspended</option></Select>
   <Select id="driver-vehicle" label="Assigned vehicle" value={values.assignedVehicleId} onChange={set("assignedVehicleId")} disabled={busy}><option value="">Unassigned</option>{vehicles.map(vehicle=><option key={vehicle.id} value={vehicle.id}>{vehicle.plate_number} - {vehicle.model}{vehicle.assigned_driver_id&&vehicle.id!==driver?.assignedVehicleId?" - currently assigned":""}</option>)}</Select>
  </div><div className="device-modal-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy?"Saving…":mode==="create"?"Add driver":"Save changes"}</Button></div></form>:<>
   <div className="device-detail-hero"><div><strong>{driver.licenseNumber}</strong><span>Driver license</span></div><StatusBadge status={driver.status}/></div>
   <dl className="device-details"><div><dt>Contact number</dt><dd>{driver.contactNumber}</dd></div><div><dt>Assigned vehicle</dt><dd>{driver.assignedVehicle}{driver.vehicleModel?` - ${driver.vehicleModel}`:""}</dd></div><div><dt>Driver record created</dt><dd>{date(driver.createdAt)}</dd></div><div><dt>Profile link</dt><dd>{driver.profileId?"Connected":"Not connected"}</dd></div></dl>
   <div className="vehicle-management-note">Deactivate drivers who should remain in trip history. Permanent removal is only available when no operational records reference the driver.</div>
   <div className="device-modal-actions split"><div className="vehicle-danger-actions"><Button type="button" variant="danger" onClick={onRemove} disabled={busy}>{busy?"Working…":"Remove"}</Button>{driver.status!=="Inactive"&&<Button type="button" variant="secondary" onClick={onDeactivate} disabled={busy}>Set inactive</Button>}</div><div><Button type="button" variant="secondary" onClick={onClose}>Close</Button><Button type="button" onClick={onEdit}>Edit driver</Button></div></div>
  </>}
 </section></div>
}
