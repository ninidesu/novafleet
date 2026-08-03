import { useEffect, useState } from "react";
import Button from "../Button.jsx";
import InlineError from "../InlineError.jsx";
import Input from "../Input.jsx";
import Select from "../Select.jsx";
import StatusBadge from "../StatusBadge.jsx";

const blank = { plateNumber: "", vehicleType: "", model: "", status: "Active", fuelCapacity: "", odometer: "" };
const readableValue = (value) => value && !["Not specified", "Not recorded"].includes(value) ? value : "Not provided";
const date = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "Not recorded";
const normalizeText = (value) => value.trim().replace(/\s+/g, " ");
const normalizePlate = (value) => normalizeText(value).toUpperCase();

export default function VehicleModal({ mode, vehicle, busy, error, canManage, statuses, onClose, onSave, onEdit, onStatusChange, onManageAssignment }) {
  const editing = mode === "create" || mode === "edit";
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(vehicle ? {
      plateNumber: vehicle.plateNumber || "",
      vehicleType: vehicle.vehicleType === "Not specified" ? "" : vehicle.vehicleType || "",
      model: vehicle.model === "Not specified" ? "" : vehicle.model || "",
      status: statuses.includes(vehicle.status) ? vehicle.status : "Inactive",
      fuelCapacity: vehicle.fuelCapacityValue ?? "",
      odometer: vehicle.odometerValue ?? "",
    } : blank);
    setErrors({});
  }, [mode, statuses, vehicle]);

  useEffect(() => {
    const handler = (event) => { if (event.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [busy, onClose]);

  const set = (field) => (event) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: "" }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (busy) return;
    const next = {};
    if (!values.plateNumber.trim()) next.plateNumber = "Plate number is required.";
    if (!values.model.trim()) next.model = "Model is required.";
    if (!values.vehicleType.trim()) next.vehicleType = "Vehicle type is required.";
    if (!statuses.includes(values.status)) next.status = "Choose a supported vehicle status.";
    if (values.fuelCapacity !== "" && (!Number.isFinite(Number(values.fuelCapacity)) || Number(values.fuelCapacity) < 0)) next.fuelCapacity = "Enter zero or a positive fuel capacity.";
    if (values.odometer !== "" && (!Number.isFinite(Number(values.odometer)) || Number(values.odometer) < 0)) next.odometer = "Enter zero or a positive odometer reading.";
    setErrors(next);
    const firstError = Object.keys(next)[0];
    const inputIds = { plateNumber: "vehicle-plate", model: "vehicle-model", vehicleType: "vehicle-type", status: "vehicle-status", fuelCapacity: "vehicle-fuel", odometer: "vehicle-odometer" };
    if (firstError) requestAnimationFrame(() => document.getElementById(inputIds[firstError])?.focus());
    if (!firstError) onSave({ ...values, plateNumber: normalizePlate(values.plateNumber), vehicleType: normalizeText(values.vehicleType), model: normalizeText(values.model) });
  };

  const title = mode === "create" ? "Add vehicle" : mode === "edit" ? "Edit vehicle" : vehicle?.plateNumber;
  const description = editing ? "Enter the vehicle's current operating details." : "Vehicle record details and current availability.";
  const statusActions = [
    { status: "Active", label: "Activate" },
    { status: "In Service", label: "Return to service" },
    { status: "Maintenance", label: "Mark under maintenance" },
    { status: "Inactive", label: "Deactivate" },
  ];

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="device-modal vehicle-modal" role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title" aria-describedby="vehicle-modal-description">
      <div className="device-modal-header"><div><span className="page-eyebrow">Fleet vehicle</span><h2 id="vehicle-modal-title">{title}</h2><p id="vehicle-modal-description" className="vehicle-modal-description">{description}</p></div><button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close vehicle dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
      {error && <div className="vehicle-modal-error"><InlineError title="Unable to complete vehicle action" message={error} /></div>}
      {editing ? <form onSubmit={submit} noValidate>
        <div className="device-form-grid vehicle-form-grid">
          <div><Input id="vehicle-plate" label="Plate number *" value={values.plateNumber} onChange={set("plateNumber")} disabled={busy} autoFocus required autoCapitalize="characters" aria-invalid={Boolean(errors.plateNumber)} aria-describedby={errors.plateNumber ? "vehicle-plate-error" : undefined} />{errors.plateNumber && <span id="vehicle-plate-error" className="field-error" role="alert">{errors.plateNumber}</span>}</div>
          <div><Input id="vehicle-model" label="Model *" value={values.model} onChange={set("model")} disabled={busy} required aria-invalid={Boolean(errors.model)} aria-describedby={errors.model ? "vehicle-model-error" : undefined} />{errors.model && <span id="vehicle-model-error" className="field-error" role="alert">{errors.model}</span>}</div>
          <div><Input id="vehicle-type" label="Vehicle type *" value={values.vehicleType} onChange={set("vehicleType")} disabled={busy} required placeholder="Van, truck, motorcycle…" aria-invalid={Boolean(errors.vehicleType)} aria-describedby={errors.vehicleType ? "vehicle-type-error" : undefined} />{errors.vehicleType && <span id="vehicle-type-error" className="field-error" role="alert">{errors.vehicleType}</span>}</div>
          <Select id="vehicle-status" label="Operational status *" value={values.status} onChange={set("status")} disabled={busy} error={errors.status}>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
          <div><Input id="vehicle-fuel" label="Fuel capacity (liters)" type="number" min="0" step="0.1" value={values.fuelCapacity} onChange={set("fuelCapacity")} disabled={busy} aria-invalid={Boolean(errors.fuelCapacity)} aria-describedby={errors.fuelCapacity ? "vehicle-fuel-error" : undefined} />{errors.fuelCapacity && <span id="vehicle-fuel-error" className="field-error" role="alert">{errors.fuelCapacity}</span>}</div>
          <div><Input id="vehicle-odometer" label="Odometer (km)" type="number" min="0" step="0.1" value={values.odometer} onChange={set("odometer")} disabled={busy} aria-invalid={Boolean(errors.odometer)} aria-describedby={errors.odometer ? "vehicle-odometer-error" : undefined} />{errors.odometer && <span id="vehicle-odometer-error" className="field-error" role="alert">{errors.odometer}</span>}</div>
        </div>
        <div className="device-modal-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : mode === "create" ? "Add vehicle" : "Save changes"}</Button></div>
      </form> : <>
        <div className="device-detail-hero"><div><strong>{readableValue(vehicle.model)}</strong><span>{readableValue(vehicle.vehicleType)}</span></div><StatusBadge status={vehicle.status || "Unknown"} /></div>
        <dl className="device-details vehicle-details"><div><dt>Plate number</dt><dd>{readableValue(vehicle.plateNumber)}</dd></div><div><dt>Assigned driver</dt><dd>{vehicle.assignedDriverId ? readableValue(vehicle.assignedDriver) : "No driver assigned"}</dd></div><div><dt>Odometer</dt><dd>{readableValue(vehicle.odometer)}</dd></div><div><dt>Fuel capacity</dt><dd>{readableValue(vehicle.fuelCapacity)}</dd></div><div className="device-detail-wide"><dt>Added to fleet</dt><dd>{date(vehicle.createdAt)}</dd></div></dl>
        {canManage && <div className="vehicle-status-actions" aria-label="Change vehicle status">{statusActions.filter((action) => action.status !== vehicle.status).map((action) => <Button key={action.status} type="button" variant="secondary" onClick={() => onStatusChange(action.status)} disabled={busy}>{action.label}</Button>)}</div>}
        <div className="device-modal-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Close</Button>{canManage && <Button type="button" variant="secondary" onClick={onManageAssignment} disabled={busy}>Manage assignment</Button>}{canManage && <Button type="button" onClick={onEdit} disabled={busy}>Edit vehicle</Button>}</div>
      </>}
    </section>
  </div>;
}
