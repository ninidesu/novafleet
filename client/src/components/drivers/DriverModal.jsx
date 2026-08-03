import { useEffect, useState } from "react";
import Button from "../Button.jsx";
import InlineError from "../InlineError.jsx";
import Input from "../Input.jsx";
import Select from "../Select.jsx";
import StatusBadge from "../StatusBadge.jsx";

const blank = { name: "", licenseNumber: "", contactNumber: "", status: "Active" };
const readableValue = (value) => value && value !== "Not recorded" ? value : "Not provided";
const date = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "Not recorded";
const cleanLicense = (value) => value.trim().toUpperCase().replace(/\s+/g, " ");
const cleanContact = (value) => value.trim().replace(/\s+/g, " ");

export default function DriverModal({ mode, driver, busy, error, canManage, statuses, onClose, onSave, onEdit, onStatusChange, onManageAssignment }) {
  const editing = mode === "create" || mode === "edit";
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(driver ? {
      name: driver.name || "",
      licenseNumber: driver.licenseNumber === "Not recorded" ? "" : driver.licenseNumber || "",
      contactNumber: driver.contactNumber === "Not recorded" ? "" : driver.contactNumber || "",
      status: statuses.includes(driver.status) ? driver.status : "Inactive",
    } : blank);
    setErrors({});
  }, [driver, mode, statuses]);

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
    const contactDigits = values.contactNumber.replace(/\D/g, "");
    if (!values.name.trim()) next.name = "Full name is required.";
    if (values.contactNumber.trim() && (!/^[+\d][\d ()-]*$/.test(values.contactNumber.trim()) || contactDigits.length < 7 || contactDigits.length > 13)) next.contactNumber = "Enter a valid contact number, such as 0917 123 4567 or +63 917 123 4567.";
    if (!statuses.includes(values.status)) next.status = "Choose a supported driver status.";
    setErrors(next);
    const firstError = Object.keys(next)[0];
    if (firstError) requestAnimationFrame(() => document.getElementById(`driver-`)?.focus());
    if (!firstError) onSave({ ...values, name: values.name.trim().replace(/\s+/g, " "), licenseNumber: cleanLicense(values.licenseNumber), contactNumber: cleanContact(values.contactNumber) });
  };

  const title = mode === "create" ? "Add driver" : mode === "edit" ? "Edit driver" : driver?.name;
  const description = editing ? "Enter the driver's current credentials and availability." : "Driver record details and current availability.";

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="device-modal driver-modal" role="dialog" aria-modal="true" aria-labelledby="driver-modal-title" aria-describedby="driver-modal-description">
      <div className="device-modal-header"><div><span className="page-eyebrow">Fleet driver</span><h2 id="driver-modal-title">{title}</h2><p id="driver-modal-description" className="driver-modal-description">{description}</p></div><button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close driver dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
      {error && <div className="driver-modal-error"><InlineError title="Unable to complete driver action" message={error} /></div>}
      {editing ? <form onSubmit={submit} noValidate>
        <div className="device-form-grid driver-form-grid">
          <div className="form-wide"><Input id="driver-name" label="Full name *" value={values.name} onChange={set("name")} disabled={busy} autoFocus required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "driver-name-error" : undefined} />{errors.name && <span id="driver-name-error" className="field-error" role="alert">{errors.name}</span>}</div>
          <Input id="driver-license" label="License number" value={values.licenseNumber} onChange={set("licenseNumber")} disabled={busy} autoCapitalize="characters" />
          <div><Input id="driver-contact" label="Contact number" type="tel" value={values.contactNumber} onChange={set("contactNumber")} disabled={busy} aria-invalid={Boolean(errors.contactNumber)} aria-describedby={errors.contactNumber ? "driver-contact-error" : undefined} />{errors.contactNumber && <span id="driver-contact-error" className="field-error" role="alert">{errors.contactNumber}</span>}</div>
          <Select id="driver-status" label="Driver status *" value={values.status} onChange={set("status")} disabled={busy} error={errors.status}>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
        </div>
        <div className="device-modal-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : mode === "create" ? "Add driver" : "Save changes"}</Button></div>
      </form> : <>
        <div className="device-detail-hero"><div><strong>{readableValue(driver.licenseNumber)}</strong><span>Driver license</span></div><StatusBadge status={driver.status || "Unknown"} /></div>
        <dl className="device-details driver-details"><div><dt>Full name</dt><dd>{readableValue(driver.name)}</dd></div><div><dt>Contact number</dt><dd>{readableValue(driver.contactNumber)}</dd></div><div><dt>Driver record created</dt><dd>{date(driver.createdAt)}</dd></div><div><dt>Profile link</dt><dd>{driver.profileId ? "Connected" : "Not connected"}</dd></div><div className="device-detail-wide"><dt>Assigned vehicle</dt><dd>{driver.assignedVehicleId ? <>{driver.assignedVehicle}{driver.vehicleModel ? ` — ${driver.vehicleModel}` : ""}</> : "No vehicle assigned"}</dd></div></dl>
        {canManage && <div className="driver-status-actions" aria-label="Change driver status">{driver.status !== "Active" && <Button type="button" variant="secondary" onClick={() => onStatusChange("Active")} disabled={busy}>Activate</Button>}{driver.status !== "Inactive" && <Button type="button" variant="secondary" onClick={() => onStatusChange("Inactive")} disabled={busy}>Deactivate</Button>}{driver.status !== "Suspended" && <Button type="button" variant="secondary" onClick={() => onStatusChange("Suspended")} disabled={busy}>Suspend</Button>}</div>}
        <div className="device-modal-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Close</Button>{canManage && <Button type="button" variant="secondary" onClick={onManageAssignment} disabled={busy}>Manage assignment</Button>}{canManage && <Button type="button" onClick={onEdit} disabled={busy}>Edit driver</Button>}</div>
      </>}
    </section>
  </div>;
}
