import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';
import { driverApi } from '../services/api';
import { openGoogleMapsNavigation } from '../lib/maps';
import { Stack, Pill, StatusBadge } from '../components/ui';
import { StatMini, StatGrid } from '../components/StatMini';
import { QuickActionGrid } from '../components/QuickAction';
import QuickAction from '../components/QuickAction';
import { BannerStack } from '../components/Banner';
import TripMap from '../components/TripMap';
import Button from '../components/Button';
import Icon from '../theme/icons';

// The screen a driver sees while a trip is in progress. Rendered inline by
// HomeScreen when there is an active trip.
export default function ActiveTripView({ navigation }) {
  const { colors } = useTheme();
  const { flags, trackingMethod, trip, assignments } = useAppState();

  const activeId = trip?.id || assignments.active?.id || null;
  const [detail, setDetail] = useState(null);

  // Load the active trip's coordinates and refresh them periodically so the map
  // follows the vehicle as new GPS readings arrive (from the ESP32 / device).
  useEffect(() => {
    if (!activeId) return undefined;
    let alive = true;
    const load = () => driverApi.trip(activeId).then((d) => { if (alive) setDetail(d); }).catch(() => {});
    load();
    const timer = setInterval(load, 15000);
    return () => { alive = false; clearInterval(timer); };
  }, [activeId]);

  const method = trackingMethod && trackingMethod !== 'iot' ? 'Phone GPS active' : 'IoT active';

  const banners = [];
  if (flags.noInternet) banners.push({ kind: 'danger', icon: 'wifiOff', text: 'Offline. Trip still recording.' });
  if (flags.gpsDisabled) banners.push({ kind: 'danger', icon: 'gps', text: 'Turn on GPS.' });
  if (flags.bgLocationDisabled) banners.push({ kind: 'danger', icon: 'mapPin', text: 'Allow background GPS.' });
  if (flags.lowBattery) banners.push({ kind: 'warning', icon: 'alertTriangle', text: 'Low battery. Charge phone.' });
  if (flags.trackingInterrupted) banners.push({ kind: 'danger', icon: 'alertTriangle', text: 'Tracking paused.' });
  if (flags.offlineSaving) banners.push({ kind: 'warning', icon: 'download', text: 'Saving offline · 3 queued' });
  if (flags.syncing) banners.push({ kind: 'info', icon: 'refresh', text: 'Syncing records…' });
  if (flags.routeDeviation) banners.push({ kind: 'danger', icon: 'route', text: 'Off route · 1.4 km' });

  const destinationCoord = detail?.plannedRoute?.length ? detail.plannedRoute[detail.plannedRoute.length - 1] : null;

  return (
    <Stack gap={14}>
      <BannerStack banners={banners} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pill label={method} bg={colors.accentDim} fg={colors.accent} />
        <StatusBadge status="In Progress" />
      </View>

      {detail ? (
        <TripMap plannedRoute={detail.plannedRoute} path={detail.path} position={detail.position} height={190} />
      ) : (
        <View style={{ height: 190, borderRadius: radius.lg, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.line }} />
      )}

      <Button
        label="Start navigation"
        icon={<Icon name="mapPin" size={16} color="#fff" />}
        onPress={() => openGoogleMapsNavigation({ destinationCoord, destinationText: detail?.destination })}
      />

      <QuickActionGrid>
        <QuickAction icon="droplet" label="Fuel" onPress={() => navigation.navigate('Fuel')} />
        <QuickAction icon="alertTriangle" label="Incident" onPress={() => navigation.navigate('Incident')} />
        <QuickAction icon="shield" label="SOS" sos onPress={() => navigation.navigate('Sos')} />
        <QuickAction icon="checkCircle" label="End trip" onPress={() => navigation.navigate('CompleteTrip')} />
      </QuickActionGrid>

      <StatGrid>
        <StatMini label="GPS" value={flags.gpsDisabled ? 'GPS off' : 'Good'} color={flags.gpsDisabled ? colors.danger : colors.success} />
        <StatMini label="Offline" value={flags.offlineSaving ? '3 queued' : '0'} />
        <StatMini label="Battery" value={flags.lowBattery ? '14%' : '68%'} color={flags.lowBattery ? colors.warning : colors.text} />
      </StatGrid>
    </Stack>
  );
}
