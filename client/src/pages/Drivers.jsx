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
import DriverModal from "../components/drivers/DriverModal.jsx";
import useToast from "../hooks/useToast.js";
import { assignDriverToVehicle, changeDriverStatus, createDriver, listDrivers, subscribeToDrivers, updateDriver } from "../services/driverService.js";
import { listVehicles } from "../services/vehicleService.js";

const DRIVER_STATUSES = ["Active", "Inactive", "On Leave", "Suspended"];
const readableValue = (value) => value && value !== "Not recorded" ? value : "—";
const date = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "—";
const mutationErrorMessage = (error, fallback) => {
  if (error?.message === "That license number is already registered.") return error.message;
  if (error?.code === "42501" || /row-level security/i.test(error?.message || "")) return "Your account is not permitted to manage drivers. Apply the fleet RLS migration, then sign out and sign back in.";
  return error?.message || fallback;
};

export default function Drivers() {
  const { role } = useAuth();
  const toast = useToast();
  const canManage = role === "admin";
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
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
      const [driverRows, vehicleRows] = await Promise.all([listDrivers(), listVehicles()]);
      setDrivers(driverRows);
      setVehicles(vehicleRows);
      setModal((current) => current?.driver ? { ...current, driver: driverRows.find((item) => item.id === current.driver.id) || current.driver } : current);
      return { driverRows, vehicleRows };
    } catch {
      setError("We couldn't load the driver list and assignment information. Check your connection and try again.");
      return null;
    } finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    return subscribeToDrivers(() => load({ quiet: true }));
  }, [load]);

  const filteredDrivers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return drivers.filter((driver) => {
      const matchesStatus = status === "all" || driver.status === status;
      const matchesSearch = !term || [driver.name, driver.licenseNumber, driver.contactNumber]
        .some((value) => String(value || "").toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [drivers, query, status]);

  const filtersActive = Boolean(query.trim()) || status !== "all";
  const resetFilters = () => { setQuery(""); setStatus("all"); };
  const openModal = (mode, driver = null) => { setModalError(""); setModal({ mode, driver }); };

  const save = async (values) => {
    if (busy) return;
    setBusy(true);
    setModalError("");
    const editing = modal.mode === "edit";
    try {
      if (editing) await updateDriver(modal.driver.id, values);
      else await createDriver(values);
      const name = values.name.trim();
      setModal(null);
      await load({ quiet: true });
      toast.success(editing ? `${name} was updated successfully.` : `${name} was added successfully.`);
    } catch (saveError) {
      setModalError(mutationErrorMessage(saveError, editing ? "We couldn't update this driver. Review the form and try again." : "We couldn't add this driver. Review the form and try again."));
    } finally { setBusy(false); }
  };

  const updateStatus = async (nextStatus) => {
    if (busy || !canManage || !modal?.driver || modal.driver.status === nextStatus) return;
    const driverName = modal.driver.name;
    if (!window.confirm(`Set ${driverName} to ${nextStatus}?`)) return;
    setBusy(true);
    setModalError("");
    try {
      await changeDriverStatus(modal.driver.id, nextStatus);
      setModal(null);
      await load({ quiet: true });
      toast.success(`${driverName} was set to ${nextStatus.toLowerCase()}.`);
    } catch {
      const message = `We couldn't change ${driverName}'s status. Please try again.`;
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
    } catch (assignmentFailure) {
      const message = assignmentFailure?.message || "We couldn't complete this assignment. Refresh the records and try again.";
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
    } catch (assignmentFailure) {
      const message = assignmentFailure?.message || "We couldn't remove this assignment. Please try again.";
      setAssignmentError(message);
      toast.error(message);
    } finally { setAssignmentBusy(false); }
  };

  const columns = [
    { key: "name", header: "Driver", render: (row) => <div className="device-name-cell driver-name-cell"><strong>{readableValue(row.name)}</strong><span>{readableValue(row.licenseNumber)}</span></div> },
    { key: "contactNumber", header: "Contact number", render: (row) => readableValue(row.contactNumber) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status || "Unknown"} /> },
    { key: "createdAt", header: "Added", render: (row) => date(row.createdAt) },
    { key: "actions", header: "Actions", render: (row) => <div className="driver-row-actions" onClick={(event) => event.stopPropagation()}><Button type="button" variant="secondary" onClick={() => openModal("view", row)}>View</Button>{canManage && <Button type="button" variant="secondary" onClick={() => openModal("edit", row)}>Edit</Button>}</div> },
  ];

  return <div>
    <PageHeader eyebrow="Fleet Operations" title="Drivers" description="Review driver credentials, contact details, and availability." actions={canManage && <Button type="button" onClick={() => openModal("create")}>Add driver</Button>} />
    <Card>
      {loading ? <LoadingState title="Loading drivers" description="Retrieving current driver and assignment records." /> : error ? <div className="resource-error"><InlineError title="Unable to load drivers" message={error} onRetry={load} /></div> : <>
        <div className="driver-toolbar" role="search" aria-label="Driver filters">
          <Input id="driver-search" label="Search drivers" placeholder="Name, license number, or contact number" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select id="driver-status-filter" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{DRIVER_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
          <Button type="button" variant="secondary" onClick={resetFilters} disabled={!filtersActive}>Reset filters</Button>
          <div className="table-record-count" aria-live="polite">{filteredDrivers.length} {filteredDrivers.length === 1 ? "driver" : "drivers"}</div>
        </div>
        {!drivers.length ? <div className="driver-empty-state"><EmptyState title="No drivers registered" description={canManage ? "Add the first driver to begin managing driver availability." : "No driver records are available yet."} />{canManage && <Button type="button" onClick={() => openModal("create")}>Add driver</Button>}</div> : <DataTable columns={columns} rows={filteredDrivers} emptyTitle="No drivers match these filters" emptyDescription="Clear the search or reset the status filter to see more drivers." onRowClick={(driver) => openModal("view", driver)} rowLabel={(driver) => `View details for ${driver.name}`} />}
      </>}
    </Card>
    {modal && <DriverModal mode={modal.mode} driver={modal.driver} busy={busy} error={modalError} canManage={canManage} statuses={DRIVER_STATUSES} onClose={() => { if (!busy) setModal(null); }} onSave={save} onEdit={() => canManage && setModal((current) => ({ ...current, mode: "edit" }))} onStatusChange={updateStatus} onManageAssignment={openAssignment} />}
    {assignmentOpen && modal?.driver && <DriverVehicleAssignmentModal context="driver" driver={modal.driver} drivers={drivers} vehicles={vehicles} busy={assignmentBusy} error={assignmentError} onAssign={assign} onUnassign={unassign} onClose={() => { if (!assignmentBusy) setAssignmentOpen(false); }} />}
  </div>;
}
