import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import InlineError from "../components/InlineError.jsx";
import Input from "../components/Input.jsx";
import LoadingState from "../components/LoadingState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Select from "../components/Select.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import DriverVehicleAssignmentModal from "../components/assignments/DriverVehicleAssignmentModal.jsx";
import VehicleModal from "../components/vehicles/VehicleModal.jsx";
import useToast from "../hooks/useToast.js";
import { assignDriverToVehicle, listDrivers } from "../services/driverService.js";
import { changeVehicleStatus, createVehicle, listVehicles, subscribeToVehicles, updateVehicle } from "../services/vehicleService.js";

const VEHICLE_STATUSES = ["Active", "In Service", "Maintenance", "Inactive"];
const readableValue = (value) => value && !["Not specified", "Not recorded"].includes(value) ? value : "—";
const date = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "—";
const mutationErrorMessage = (error, fallback) => error?.message === "That plate number is already registered." ? error.message : fallback;

export default function Vehicles() {
  const { role } = useAuth();
  const toast = useToast();
  const canManage = role === "admin";
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [modalError, setModalError] = useState("");
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const [vehicleRows, driverRows] = await Promise.all([listVehicles(), listDrivers()]);
      setVehicles(vehicleRows);
      setDrivers(driverRows);
      setModal((current) => current?.vehicle ? { ...current, vehicle: vehicleRows.find((item) => item.id === current.vehicle.id) || current.vehicle } : current);
      return { vehicleRows, driverRows };
    } catch {
      setError("We couldn't load the vehicle list and assignment information. Check your connection and try again.");
      return null;
    } finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    return subscribeToVehicles(() => load({ quiet: true }));
  }, [load]);

  const filteredVehicles = useMemo(() => {
    const term = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesStatus = status === "all" || vehicle.status === status;
      const matchesSearch = !term || [vehicle.plateNumber, vehicle.model, vehicle.vehicleType, `${vehicle.vehicleType} ${vehicle.model}`]
        .some((value) => String(value || "").toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [query, status, vehicles]);

  const filtersActive = Boolean(query.trim()) || status !== "all";
  const resetFilters = () => { setQuery(""); setStatus("all"); };
  const openModal = (mode, vehicle = null) => { setModalError(""); setModal({ mode, vehicle }); };

  const save = async (values) => {
    if (busy) return;
    setBusy(true);
    setModalError("");
    const editing = modal.mode === "edit";
    try {
      if (editing) await updateVehicle(modal.vehicle.id, values);
      else await createVehicle(values);
      const plate = values.plateNumber.trim().toUpperCase();
      setModal(null);
      await load({ quiet: true });
      toast.success(editing ? `${plate} was updated successfully.` : `${plate} was added successfully.`);
    } catch (saveError) {
      setModalError(mutationErrorMessage(saveError, editing ? "We couldn't update this vehicle. Review the form and try again." : "We couldn't add this vehicle. Review the form and try again."));
    } finally { setBusy(false); }
  };

  const updateStatus = async (nextStatus) => {
    if (busy || !canManage || !modal?.vehicle || modal.vehicle.status === nextStatus) return;
    const plate = modal.vehicle.plateNumber;
    if (!window.confirm(`Set ${plate} to ${nextStatus}?`)) return;
    setBusy(true);
    setModalError("");
    try {
      await changeVehicleStatus(modal.vehicle.id, nextStatus);
      setModal(null);
      await load({ quiet: true });
      toast.success(`${plate} was set to ${nextStatus.toLowerCase()}.`);
    } catch {
      const message = `We couldn't change ${plate}'s status. Please try again.`;
      setModalError(message);
      toast.error(message);
    } finally { setBusy(false); }
  };

  const openAssignment = () => { setAssignmentError(""); setAssignmentOpen(true); };
  const assign = async ({ driver, vehicle, requiresConfirmation }) => {
    if (assignmentBusy || !canManage) return;
    if (requiresConfirmation) {
      const currentDriver = vehicle.assignedDriverId && vehicle.assignedDriverId !== driver.id ? ` ${vehicle.plateNumber} is currently assigned to ${vehicle.assignedDriver}.` : "";
      const currentVehicle = driver.assignedVehicleId && driver.assignedVehicleId !== vehicle.id ? ` ${driver.name} is currently assigned to ${driver.assignedVehicle}.` : "";
      if (!window.confirm(`${currentDriver}${currentVehicle} Continue and replace the existing assignment?`.trim())) return;
    }
    setAssignmentBusy(true);
    setAssignmentError("");
    try {
      await assignDriverToVehicle(driver.id, vehicle.id);
      await load({ quiet: true });
      setAssignmentOpen(false);
      toast.success(`${driver.name} was assigned to ${vehicle.plateNumber}.`);
    } catch {
      const message = "We couldn't complete this assignment. Refresh the records and try again.";
      setAssignmentError(message);
      toast.error(message);
    } finally { setAssignmentBusy(false); }
  };

  const unassign = async ({ driver, vehicle }) => {
    if (assignmentBusy || !canManage) return;
    if (!window.confirm(`Unassign ${driver.name} from ${vehicle.plateNumber}? Both records will be preserved.`)) return;
    setAssignmentBusy(true);
    setAssignmentError("");
    try {
      await assignDriverToVehicle(driver.id, "");
      await load({ quiet: true });
      setAssignmentOpen(false);
      toast.success(`${driver.name} was unassigned from ${vehicle.plateNumber}.`);
    } catch {
      const message = "We couldn't remove this assignment. Please try again.";
      setAssignmentError(message);
      toast.error(message);
    } finally { setAssignmentBusy(false); }
  };

  const columns = [
    { key: "plateNumber", header: "Vehicle", render: (row) => <div className="device-name-cell vehicle-name-cell"><strong>{readableValue(row.plateNumber)}</strong><span>{readableValue(row.model)}</span></div> },
    { key: "vehicleType", header: "Type", render: (row) => readableValue(row.vehicleType) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status || "Unknown"} /> },
    { key: "odometer", header: "Odometer", render: (row) => readableValue(row.odometer) },
    { key: "createdAt", header: "Added", render: (row) => date(row.createdAt) },
    { key: "actions", header: "Actions", render: (row) => <div className="vehicle-row-actions" onClick={(event) => event.stopPropagation()}><Button type="button" variant="secondary" onClick={() => openModal("view", row)}>View</Button>{canManage && <Button type="button" variant="secondary" onClick={() => openModal("edit", row)}>Edit</Button>}</div> },
  ];

  return <div>
    <PageHeader eyebrow="Fleet Operations" title="Vehicles" description="Review fleet inventory, operating details, and availability." actions={canManage && <Button type="button" onClick={() => openModal("create")}>Add vehicle</Button>} />
    <Card>
      {loading ? <LoadingState title="Loading vehicles" description="Retrieving current vehicle and assignment records." /> : error ? <div className="resource-error"><InlineError title="Unable to load vehicles" message={error} onRetry={load} /></div> : <>
        <div className="vehicle-toolbar" role="search" aria-label="Vehicle filters">
          <Input id="vehicle-search" label="Search vehicles" placeholder="Plate number, model, or vehicle type" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select id="vehicle-status-filter" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{VEHICLE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
          <Button type="button" variant="secondary" onClick={resetFilters} disabled={!filtersActive}>Reset filters</Button>
          <div className="table-record-count" aria-live="polite">{filteredVehicles.length} {filteredVehicles.length === 1 ? "vehicle" : "vehicles"}</div>
        </div>
        {!vehicles.length ? <div className="vehicle-empty-state"><EmptyState title="No vehicles registered" description={canManage ? "Add the first vehicle to begin managing fleet availability." : "No vehicle records are available yet."} />{canManage && <Button type="button" onClick={() => openModal("create")}>Add vehicle</Button>}</div> : <DataTable columns={columns} rows={filteredVehicles} emptyTitle="No vehicles match these filters" emptyDescription="Clear the search or reset the status filter to see more vehicles." onRowClick={(vehicle) => openModal("view", vehicle)} rowLabel={(vehicle) => `View details for vehicle ${vehicle.plateNumber}`} />}
      </>}
    </Card>
    {modal && <VehicleModal mode={modal.mode} vehicle={modal.vehicle} busy={busy} error={modalError} canManage={canManage} statuses={VEHICLE_STATUSES} onClose={() => { if (!busy) setModal(null); }} onSave={save} onEdit={() => canManage && setModal((current) => ({ ...current, mode: "edit" }))} onStatusChange={updateStatus} onManageAssignment={openAssignment} />}
    {assignmentOpen && modal?.vehicle && <DriverVehicleAssignmentModal context="vehicle" vehicle={modal.vehicle} drivers={drivers} vehicles={vehicles} busy={assignmentBusy} error={assignmentError} onAssign={assign} onUnassign={unassign} onClose={() => { if (!assignmentBusy) setAssignmentOpen(false); }} />}
  </div>;
}
