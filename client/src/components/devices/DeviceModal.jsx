import { useEffect, useState } from "react";
import Button from "../Button.jsx";
import Input from "../Input.jsx";
import Select from "../Select.jsx";
import StatusBadge from "../StatusBadge.jsx";

const blankDevice={deviceUid:"",name:"",type:"GPS Tracker",serialNumber:"",firmwareVersion:"",connectionStatus:"Offline",gpsStatus:"No GPS",installedAt:"",vehicleId:"",latitude:"",longitude:"",notes:""};
const formatDate=(value)=>value?new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"Never";
export default function DeviceModal({mode,device,vehicles,busy,error,onClose,onSave,onEdit,onRemove}){
 const editing=mode==="create"||mode==="edit"; const[values,setValues]=useState(blankDevice); const[errors,setErrors]=useState({});
 useEffect(()=>{setValues(device?{...blankDevice,...device,serialNumber:device.serialNumber==="..."?"":device.serialNumber,firmwareVersion:device.firmwareVersion==="..."?"":device.firmwareVersion}:blankDevice);setErrors({})},[device,mode]);
 useEffect(()=>{const handler=(event)=>{if(event.key==="Escape"&&!busy)onClose()};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler)},[busy,onClose]);
 const setField=(field)=>(event)=>setValues(current=>({...current,[field]:event.target.value}));
 const submit=(event)=>{event.preventDefault();const next={};if(!values.deviceUid.trim())next.deviceUid="Device ID is required.";if(!values.name.trim())next.name="Device name is required.";setErrors(next);if(!Object.keys(next).length)onSave(values)};
 const title=mode==="create"?"Add IoT device":mode==="edit"?"Edit IoT device":device?.name;
 return <div className="modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget&&!busy)onClose()}}><section className="device-modal" role="dialog" aria-modal="true" aria-labelledby="device-modal-title">
  <div className="device-modal-header"><div><span className="page-eyebrow">IoT device</span><h2 id="device-modal-title">{title}</h2></div><button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
  {error&&<div className="device-form-error" role="alert">{error}</div>}
  {editing?<form onSubmit={submit}><div className="device-form-grid">
   <div><Input id="device-uid" label="Device ID" value={values.deviceUid} onChange={setField("deviceUid")} disabled={busy} aria-invalid={Boolean(errors.deviceUid)}/>{errors.deviceUid&&<span className="field-error">{errors.deviceUid}</span>}</div>
   <div><Input id="device-name" label="Device name" value={values.name} onChange={setField("name")} disabled={busy} aria-invalid={Boolean(errors.name)}/>{errors.name&&<span className="field-error">{errors.name}</span>}</div>
   <Select id="device-type" label="Device type" value={values.type} onChange={setField("type")} disabled={busy}><option>GPS Tracker</option><option>Telematics Gateway</option><option>Fuel Sensor</option><option>OBD-II Unit</option></Select>
   <Select id="device-vehicle" label="Assigned vehicle" value={values.vehicleId} onChange={setField("vehicleId")} disabled={busy}><option value="">Unassigned</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.plate_number} - {v.model}</option>)}</Select>
   <Input id="device-serial" label="Serial number" value={values.serialNumber} onChange={setField("serialNumber")} disabled={busy}/><Input id="device-firmware" label="Firmware version" value={values.firmwareVersion} onChange={setField("firmwareVersion")} disabled={busy}/>
   <Select id="device-connection" label="Connection status" value={values.connectionStatus} onChange={setField("connectionStatus")} disabled={busy}><option>Online</option><option>Offline</option><option>Maintenance</option></Select>
   <Select id="device-gps" label="GPS status" value={values.gpsStatus} onChange={setField("gpsStatus")} disabled={busy}><option>Active</option><option>No GPS</option><option>Disabled</option></Select>
   <Input id="device-installed" label="Installed date" type="date" value={values.installedAt||""} onChange={setField("installedAt")} disabled={busy}/>
   <Input id="device-latitude" label="Latitude" type="number" step="any" min="-90" max="90" value={values.latitude} onChange={setField("latitude")} disabled={busy}/><Input id="device-longitude" label="Longitude" type="number" step="any" min="-180" max="180" value={values.longitude} onChange={setField("longitude")} disabled={busy}/>
   <label className="input-wrap device-notes" htmlFor="device-notes"><span className="input-label">Notes</span><textarea id="device-notes" className="input" rows="3" value={values.notes} onChange={setField("notes")} disabled={busy}/></label>
  </div><div className="device-modal-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy?"Saving...":mode==="create"?"Add device":"Save changes"}</Button></div></form>:<>
   <div className="device-detail-hero"><div><strong>{device.deviceUid}</strong><span>{device.type}</span></div><StatusBadge status={device.connectionStatus}/></div>
   <dl className="device-details"><div><dt>Assigned vehicle</dt><dd>{device.assignedVehicle}{device.vehicleModel?` - ${device.vehicleModel}`:""}</dd></div><div><dt>GPS status</dt><dd><StatusBadge status={device.gpsStatus}/></dd></div><div><dt>Serial number</dt><dd>{device.serialNumber}</dd></div><div><dt>Firmware</dt><dd>{device.firmwareVersion}</dd></div><div><dt>Installed</dt><dd>{device.installedAt||"Not recorded"}</dd></div><div><dt>Last connection</dt><dd>{formatDate(device.lastSeenAt)}</dd></div><div className="device-detail-wide"><dt>Notes</dt><dd>{device.notes||"No notes added."}</dd></div></dl>
   <div className="device-modal-actions split"><Button type="button" variant="danger" onClick={onRemove} disabled={busy}>{busy?"Removing...":"Remove device"}</Button><div><Button type="button" variant="secondary" onClick={onClose}>Close</Button><Button type="button" onClick={onEdit}>Edit device</Button></div></div>
  </>}
 </section></div>
}
