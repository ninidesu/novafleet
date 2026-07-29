import { useEffect, useState } from "react";
import Button from "../Button.jsx";
import Input from "../Input.jsx";
import Select from "../Select.jsx";
import StatusBadge from "../StatusBadge.jsx";
const blank={vehicleId:"",maintenanceType:"",serviceDate:"",cost:"",notes:""};
export default function MaintenanceModal({mode,record,vehicles,busy,error,onClose,onSave,onEdit,onRemove}){
 const editing=mode==="create"||mode==="edit";const[values,setValues]=useState(blank);const[errors,setErrors]=useState({});
 useEffect(()=>{setValues(record?{vehicleId:record.vehicleId,maintenanceType:record.maintenanceType,serviceDate:record.serviceDateValue,cost:record.costValue,notes:record.notes}:blank);setErrors({})},[record,mode]);
 useEffect(()=>{const handler=e=>{if(e.key==="Escape"&&!busy)onClose()};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler)},[busy,onClose]);
 const set=field=>event=>setValues(current=>({...current,[field]:event.target.value}));
 const submit=event=>{event.preventDefault();const next={};if(!values.vehicleId)next.vehicleId="Vehicle is required.";if(!values.maintenanceType.trim())next.maintenanceType="Maintenance type is required.";if(!values.serviceDate)next.serviceDate="Service date is required.";if(values.cost!==""&&Number(values.cost)<0)next.cost="Enter zero or a positive cost.";setErrors(next);if(!Object.keys(next).length)onSave(values)};
 const title=mode==="create"?"Schedule maintenance":mode==="edit"?"Edit maintenance record":record?.maintenanceType;
 return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose()}}><section className="device-modal maintenance-modal" role="dialog" aria-modal="true" aria-labelledby="maintenance-modal-title">
  <div className="device-modal-header"><div><span className="page-eyebrow">Vehicle service</span><h2 id="maintenance-modal-title">{title}</h2></div><button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
  {error&&<div className="device-form-error" role="alert">{error}</div>}
  {editing?<form onSubmit={submit}><div className="device-form-grid maintenance-form-grid">
   <div><Select id="maintenance-vehicle" label="Vehicle" value={values.vehicleId} onChange={set("vehicleId")} disabled={busy} error={errors.vehicleId}><option value="">Select a vehicle</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.plate_number} - {v.model} - {v.status}</option>)}</Select></div>
   <div><Input id="maintenance-type" label="Maintenance type" value={values.maintenanceType} onChange={set("maintenanceType")} disabled={busy} placeholder="Oil change, tire replacement…" aria-invalid={Boolean(errors.maintenanceType)}/>{errors.maintenanceType&&<span className="field-error">{errors.maintenanceType}</span>}</div>
   <div><Input id="maintenance-date" label="Service date" type="date" value={values.serviceDate} onChange={set("serviceDate")} disabled={busy} aria-invalid={Boolean(errors.serviceDate)}/>{errors.serviceDate&&<span className="field-error">{errors.serviceDate}</span>}</div>
   <div><Input id="maintenance-cost" label="Cost (PHP)" type="number" min="0" step="0.01" value={values.cost} onChange={set("cost")} disabled={busy}/>{errors.cost&&<span className="field-error">{errors.cost}</span>}</div>
   <label className="input-wrap device-notes" htmlFor="maintenance-notes"><span className="input-label">Service notes</span><textarea id="maintenance-notes" className="input" rows="4" value={values.notes} onChange={set("notes")} disabled={busy}/></label>
  </div><div className="device-modal-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy?"Saving…":mode==="create"?"Save maintenance":"Save changes"}</Button></div></form>:<>
   <div className="device-detail-hero"><div><strong>{record.vehicle}</strong><span>{record.vehicleModel||"Vehicle"}</span></div><StatusBadge status={record.scheduleStatus}/></div>
   <dl className="device-details"><div><dt>Service date</dt><dd>{record.serviceDate}</dd></div><div><dt>Cost</dt><dd>{record.cost}</dd></div><div><dt>Vehicle status</dt><dd><StatusBadge status={record.vehicleStatus}/></dd></div><div className="device-detail-wide"><dt>Service notes</dt><dd>{record.notes||"No notes recorded."}</dd></div></dl>
   <div className="vehicle-management-note">This record uses the existing maintenance schema. Future dates are shown as Scheduled; current and past dates are shown as Recorded.</div>
   <div className="device-modal-actions split"><Button type="button" variant="danger" onClick={onRemove} disabled={busy}>{busy?"Removing…":"Remove record"}</Button><div><Button type="button" variant="secondary" onClick={onClose}>Close</Button><Button type="button" onClick={onEdit}>Edit record</Button></div></div>
  </>}
 </section></div>
}
