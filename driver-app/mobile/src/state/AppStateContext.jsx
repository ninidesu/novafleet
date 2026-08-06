import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { driverApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AppStateContext = createContext(null);

const INITIAL_FLAGS = {
  // connectivity / device conditions — simulated for now (real GPS/IoT/network
  // state wires in during the offline phase). Toggle from Profile > Developer preview.
  iotOffline: false,
  gpsDisabled: false,
  bgLocationDisabled: false,
  lowBattery: false,
  noInternet: false,
  offlineSaving: false,
  syncing: false,
  trackingInterrupted: false,
  routeDeviation: false,
  homeEmpty: false,
  assignEmpty: false,
};

const EMPTY_ASSIGNMENTS = { active: null, upcoming: [], history: [] };

function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'D';
}

// Map the /driver/me response into the shape the screens expect.
function mapDriver(p) {
  if (!p) return { name: 'Driver', initials: 'D', id: '—', branch: 'NovaFleet', phone: '—', device: '—', status: 'Active', vehicle: null };
  return {
    name: p.name,
    initials: initials(p.name),
    id: p.licenseNumber && p.licenseNumber !== 'Not recorded' ? p.licenseNumber : 'Driver',
    branch: p.vehicle?.plateNumber || 'No vehicle assigned',
    phone: p.contactNumber || 'Not recorded',
    device: p.vehicle ? `${p.vehicle.plateNumber} · ${p.vehicle.model || p.vehicle.vehicleType || 'Vehicle'}` : 'No vehicle',
    status: p.status || 'Active',
    vehicle: p.vehicle || null,
  };
}

export function AppStateProvider({ children }) {
  const { isAuthenticated, signOut } = useAuth();

  const [flags, setFlags] = useState(INITIAL_FLAGS);
  const [tripActive, setTripActive] = useState(false);
  const [trackingMethod, setTrackingMethod] = useState(null); // 'iot' | 'mobile' | 'fallback'
  const [trip, setTrip] = useState(null); // active trip record once started
  const [lastCompletedTrip, setLastCompletedTrip] = useState(null);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Real driver data from the API.
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState(EMPTY_ASSIGNMENTS);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  const toggleFlag = (key) => setFlags((f) => ({ ...f, [key]: !f[key] }));
  const setFlag = (key, val) => setFlags((f) => ({ ...f, [key]: val }));

  const showToast = (kind, icon, text) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, icon, text });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const reloadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setDataError('');
    try {
      const [me, assigns] = await Promise.all([driverApi.me(), driverApi.assignments()]);
      setProfile(me);
      setAssignments(assigns || EMPTY_ASSIGNMENTS);
    } catch (error) {
      setDataError(error.message || 'Unable to load your data.');
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      setDataLoading(true);
      reloadData();
    } else {
      setProfile(null);
      setAssignments(EMPTY_ASSIGNMENTS);
      setDataLoading(false);
    }
  }, [isAuthenticated, reloadData]);

  const startTrip = (method, reason) => {
    setTrackingMethod(method);
    const target = assignments.active || assignments.upcoming[0] || null;
    setTrip({
      id: target?.id || null,
      ref: target?.tripCode || 'TRIP',
      route: target?.route || 'Active trip',
      vehicle: target?.vehicle || profile?.vehicle?.plateNumber || 'Vehicle',
      startedAt: new Date(),
      method,
      reason: reason || null,
      fuelRecords: [],
      incidents: [],
    });
    setTripActive(true);
    // Mark the trip active on the server (best-effort), then refresh.
    if (target?.id && target.state !== 'active') {
      driverApi.startTrip(target.id).then(reloadData).catch(() => {});
    }
  };

  const submitFuel = (record) => {
    setTrip((t) => (t ? { ...t, fuelRecords: [...t.fuelRecords, record] } : t));
    driverApi
      .logFuel({ liters: record?.liters, cost: record?.total ?? record?.cost, odometerKm: record?.odometer ?? record?.odo })
      .catch(() => {});
    showToast('success', 'checkCircle', 'Fuel record submitted.');
  };

  const submitIncident = (record) => {
    setTrip((t) => (t ? { ...t, incidents: [...t.incidents, record] } : t));
    driverApi
      .reportIncident({ type: record?.type || 'driver_report', note: record?.description ?? record?.note })
      .catch(() => {});
    showToast('success', 'checkCircle', 'Incident sent.');
  };

  const [sosConfirmed, setSosConfirmed] = useState(false);
  const confirmSos = () => setSosConfirmed(true);
  const resetSos = () => setSosConfirmed(false);

  const completeTrip = (details) => {
    const completed = { ...trip, ...details, endedAt: new Date(), pendingSync: flags.syncing };
    if (trip?.id) driverApi.completeTrip(trip.id).catch(() => {});
    setLastCompletedTrip(completed);
    setTripActive(false);
    setTrip(null);
    setTrackingMethod(null);
    setSosConfirmed(false);
    reloadData();
  };

  const logout = useCallback(async () => {
    try {
      await signOut();
    } finally {
      setProfile(null);
      setAssignments(EMPTY_ASSIGNMENTS);
    }
  }, [signOut]);

  const driver = useMemo(() => mapDriver(profile), [profile]);
  const nextTrip = assignments.active || assignments.upcoming[0] || null;

  const value = useMemo(
    () => ({
      driver,
      profile,
      assignments,
      nextTrip,
      dataLoading,
      dataError,
      reloadData,
      logout,
      flags,
      toggleFlag,
      setFlag,
      tripActive,
      trip,
      trackingMethod,
      startTrip,
      submitFuel,
      submitIncident,
      sosConfirmed,
      confirmSos,
      resetSos,
      completeTrip,
      lastCompletedTrip,
      notificationsRead,
      markNotificationsRead: () => setNotificationsRead(true),
      toast,
      showToast,
    }),
    [driver, profile, assignments, nextTrip, dataLoading, dataError, reloadData, logout, flags, tripActive, trip, trackingMethod, sosConfirmed, lastCompletedTrip, notificationsRead, toast]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}
