import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { DRIVER } from '../data/mockData';

const AppStateContext = createContext(null);

const INITIAL_FLAGS = {
  // connectivity / device conditions — simulated for now (no real GPS/IoT/
  // network integration yet). Toggle these from Profile > Developer preview.
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

export function AppStateProvider({ children }) {
  const [flags, setFlags] = useState(INITIAL_FLAGS);
  const [tripActive, setTripActive] = useState(false);
  const [trackingMethod, setTrackingMethod] = useState(null); // 'iot' | 'mobile' | 'fallback'
  const [trip, setTrip] = useState(null); // active trip record once started
  const [lastCompletedTrip, setLastCompletedTrip] = useState(null);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const toggleFlag = (key) => setFlags((f) => ({ ...f, [key]: !f[key] }));
  const setFlag = (key, val) => setFlags((f) => ({ ...f, [key]: val }));

  const showToast = (kind, icon, text) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, icon, text });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const startTrip = (method, reason) => {
    setTrackingMethod(method);
    setTrip({
      ref: 'TRP-58291',
      route: 'Kitengela Branch → Machakos Client Circuit',
      vehicle: 'KDG 214P',
      startedAt: new Date(),
      method,
      reason: reason || null,
      fuelRecords: [],
      incidents: [],
    });
    setTripActive(true);
  };

  const submitFuel = (record) => {
    setTrip((t) => (t ? { ...t, fuelRecords: [...t.fuelRecords, record] } : t));
    showToast('success', 'checkCircle', 'Fuel record submitted.');
  };

  const submitIncident = (record) => {
    setTrip((t) => (t ? { ...t, incidents: [...t.incidents, record] } : t));
    showToast('success', 'checkCircle', 'Incident sent.');
  };

  const [sosConfirmed, setSosConfirmed] = useState(false);
  const confirmSos = () => setSosConfirmed(true);
  const resetSos = () => setSosConfirmed(false);

  const completeTrip = (details) => {
    const completed = {
      ...trip,
      ...details,
      endedAt: new Date(),
      pendingSync: flags.syncing,
    };
    setLastCompletedTrip(completed);
    setTripActive(false);
    setTrip(null);
    setTrackingMethod(null);
    setSosConfirmed(false);
  };

  const value = useMemo(
    () => ({
      driver: DRIVER,
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
    [flags, tripActive, trip, trackingMethod, sosConfirmed, lastCompletedTrip, notificationsRead, toast]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}
