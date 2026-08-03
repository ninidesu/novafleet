import { useEffect, useMemo, useState } from "react";
import Button from "../Button.jsx";
import InlineError from "../InlineError.jsx";
import LoadingState from "../LoadingState.jsx";
import Select from "../Select.jsx";
import StatusBadge from "../StatusBadge.jsx";

const ELIGIBLE_DRIVER_STATUSES = ["Active"];
const ELIGIBLE_VEHICLE_STATUSES = ["Active", "In Service"];
const assigned = (value) => Boolean(value && value !== "Unassigned");

export default function DriverVehicleAssignmentModal({ context, driver, vehicle, drivers, vehicles, busy = false, error = "", optionsLoading = false, optionsError = "", onRetry, onAssign, onUnassign, onClose }) {
  const driverContext = context === "driver";
  const currentDriver = driverContext ? driver : drivers.find((item) => item.id === vehicle?.assignedDriverId) || null;
  const currentVehicle = driverContext ? vehicles.find((item) => item.id === driver?.assignedVehicleId) || null : vehicle;
  const currentAssignmentExists = Boolean(currentDriver && currentVehicle && (currentVehicle.assignedDriverId === currentDriver.id || currentDriver.assignedVehicleId === currentVehicle.id));
  const [selectedId, setSelectedId] = useState(driverContext ? currentVehicle?.id || "" : currentDriver?.id || "");

  useEffect(() => {
    setSelectedId(driverContext ? currentVehicle?.id || "" : currentDriver?.id || "");
  }, [currentDriver?.id, currentVehicle?.id, driverContext]);

  useEffect(() => {
    const handler = (event) => { if (event.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [busy, onClose]);

  const selectedDriver = driverContext ? driver : drivers.find((item) => item.id === selectedId) || null;
  const selectedVehicle = driverContext ? vehicles.find((item) => item.id === selectedId) || null : vehicle;
  const driverEligible = selectedDriver ? ELIGIBLE_DRIVER_STATUSES.includes(selectedDriver.status) : false;
  const vehicleEligible = selectedVehicle ? ELIGIBLE_VEHICLE_STATUSES.includes(selectedVehicle.status) : false;
  const unchanged = driverContext ? selectedId === (currentVehicle?.id || "") : selectedId === (currentDriver?.id || "");
  const canSubmit = Boolean(selectedId && selectedDriver && selectedVehicle && driverEligible && vehicleEligible && !unchanged && !busy);

  const eligibleCount = useMemo(() => {
    const records = driverContext ? vehicles : drivers;
    return records.filter((item) => driverContext ? ELIGIBLE_VEHICLE_STATUSES.includes(item.status) : ELIGIBLE_DRIVER_STATUSES.includes(item.status)).length;
  }, [driverContext, drivers, vehicles]);

  const optionLabel = (item) => {
    if (driverContext) {
      const reasons = [];
      if (!ELIGIBLE_VEHICLE_STATUSES.includes(item.status)) reasons.push(item.status);
      if (assigned(item.assignedDriver) && item.assignedDriverId !== driver?.id) reasons.push(`assigned to ${item.assignedDriver}`);
      return `${item.plateNumber} — ${item.model || item.vehicleType || "Vehicle"}${reasons.length ? ` (${reasons.join(", ")})` : ""}`;
    }
    const reasons = [];
    if (!ELIGIBLE_DRIVER_STATUSES.includes(item.status)) reasons.push(item.status);
    if (assigned(item.assignedVehicle) && item.assignedVehicleId !== vehicle?.id) reasons.push(`assigned to ${item.assignedVehicle}`);
    return `${item.name} — ${item.licenseNumber || "No license recorded"}${reasons.length ? ` (${reasons.join(", ")})` : ""}`;
  };

  const selectedConflict = driverContext
    ? selectedVehicle && assigned(selectedVehicle.assignedDriver) && selectedVehicle.assignedDriverId !== driver?.id
    : selectedDriver && assigned(selectedDriver.assignedVehicle) && selectedDriver.assignedVehicleId !== vehicle?.id;
  const movesFixedRecord = driverContext
    ? Boolean(currentVehicle && selectedVehicle && currentVehicle.id !== selectedVehicle.id)
    : Boolean(currentDriver && selectedDriver && currentDriver.id !== selectedDriver.id);

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onAssign({ driver: selectedDriver, vehicle: selectedVehicle, requiresConfirmation: Boolean(selectedConflict || movesFixedRecord) });
  };

  const fixedTitle = driverContext ? driver?.name : vehicle?.plateNumber;
  const fixedMeta = driverContext ? `${driver?.licenseNumber || "No license recorded"} · ${driver?.status || "Unknown"}` : `${vehicle?.model || "Vehicle"} · ${vehicle?.status || "Unknown"}`;

  return <div className="modal-backdrop assignment-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="device-modal assignment-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title" aria-describedby="assignment-modal-description">
      <div className="device-modal-header"><div><span className="page-eyebrow">Fleet assignment</span><h2 id="assignment-modal-title">Manage Driver–Vehicle assignment</h2><p id="assignment-modal-description" className="assignment-modal-description">Assign, reassign, or disconnect the selected fleet records.</p></div><button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close assignment dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>

      <div className="assignment-content">
        <div className="assignment-fixed-summary"><span>{driverContext ? "Driver" : "Vehicle"}</span><strong>{fixedTitle}</strong><small>{fixedMeta}</small></div>

        <section className="assignment-current" aria-labelledby="current-assignment-title"><div><span className="page-eyebrow">Current assignment</span><h3 id="current-assignment-title">{currentAssignmentExists ? `${currentDriver.name} ↔ ${currentVehicle.plateNumber}` : "No current assignment"}</h3></div>{currentAssignmentExists && <div className="assignment-current-status"><StatusBadge status={currentDriver.status} /><StatusBadge status={currentVehicle.status} /></div>}<p>{currentAssignmentExists ? `${currentVehicle.model || currentVehicle.vehicleType || "Vehicle"} is currently assigned to ${currentDriver.name}.` : driverContext ? `${driver.name} has no vehicle assigned.` : `${vehicle.plateNumber} has no driver assigned.`}</p></section>

        {optionsLoading ? <LoadingState title="Loading assignment options" description="Checking current Driver and Vehicle availability." /> : optionsError ? <InlineError variant="compact" title="Unable to load assignment options" message={optionsError} onRetry={onRetry} /> : <form onSubmit={submit}>
          <Select id="assignment-selection" label={driverContext ? "Vehicle" : "Driver"} value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={busy} autoFocus aria-describedby={selectedId && (!driverEligible || !vehicleEligible) ? "assignment-selection-error" : undefined}>
            <option value="">{driverContext ? "Select a vehicle" : "Select a driver"}</option>
            {(driverContext ? vehicles : drivers).map((item) => {
              const isCurrent = driverContext ? item.id === currentVehicle?.id : item.id === currentDriver?.id;
              const eligible = driverContext ? ELIGIBLE_VEHICLE_STATUSES.includes(item.status) : ELIGIBLE_DRIVER_STATUSES.includes(item.status);
              return <option key={item.id} value={item.id} disabled={!eligible && !isCurrent}>{optionLabel(item)}</option>;
            })}
          </Select>

          {!eligibleCount && <p className="assignment-empty-note">No eligible {driverContext ? "Vehicles" : "Drivers"} are available. {driverContext ? "Vehicles must be Active or In Service." : "Drivers must be Active."}</p>}
          {selectedId && (!driverEligible || !vehicleEligible) && <p id="assignment-selection-error" className="field-error" role="alert">{!driverEligible ? "Only Active Drivers can be assigned." : "Only Active or In Service Vehicles can be assigned."}</p>}
          {selectedConflict && <p className="assignment-warning">The selected {driverContext ? "Vehicle already has another Driver" : "Driver already has another Vehicle"}. Continuing requires confirmation and will replace that assignment.</p>}
          {movesFixedRecord && !selectedConflict && <p className="assignment-warning">This changes the current assignment. You will be asked to confirm before saving.</p>}
          {error && <InlineError variant="compact" title="Unable to update assignment" message={error} />}

          <div className="assignment-actions"><div>{currentAssignmentExists && <Button type="button" variant="danger" onClick={() => onUnassign({ driver: currentDriver, vehicle: currentVehicle })} disabled={busy}>{busy ? "Working…" : "Unassign"}</Button>}</div><div><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={!canSubmit}>{busy ? "Saving…" : currentAssignmentExists ? "Save assignment" : "Assign"}</Button></div></div>
        </form>}
      </div>
    </section>
  </div>;
}
