import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';
import { Stack, Pill, StatusBadge } from '../components/ui';
import { StatMini, StatGrid } from '../components/StatMini';
import { QuickActionGrid } from '../components/QuickAction';
import QuickAction from '../components/QuickAction';
import { BannerStack } from '../components/Banner';

// The screen a driver sees while a trip is in progress. Rendered inline by
// HomeScreen (the Home tab "becomes" this screen while tripActive is true),
// matching the wireframe spec rather than being a separate stack route.
export default function ActiveTripView({ navigation }) {
  const { colors } = useTheme();
  const { flags, trackingMethod, trip } = useAppState();

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

  return (
    <Stack gap={14}>
      <BannerStack banners={banners} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pill label={method} bg={colors.accentDim} fg={colors.accent} />
        <StatusBadge status="In Progress" />
      </View>

      <View
        style={{
          height: 180,
          borderRadius: radius.lg,
          backgroundColor: colors.accentDim,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      />

      <QuickActionGrid>
        <QuickAction icon="droplet" label="Fuel" onPress={() => navigation.navigate('Fuel')} />
        <QuickAction icon="alertTriangle" label="Incident" onPress={() => navigation.navigate('Incident')} />
        <QuickAction icon="shield" label="SOS" sos onPress={() => navigation.navigate('Sos')} />
        <QuickAction icon="checkCircle" label="End trip" onPress={() => navigation.navigate('CompleteTrip')} />
      </QuickActionGrid>

      <StatGrid>
        <StatMini label="Elapsed" value="0:42:18" />
        <StatMini label="Distance" value="6.4 km" />
        <StatMini label="ETA" value="12:10" />
      </StatGrid>
      <StatGrid>
        <StatMini label="GPS" value={flags.gpsDisabled ? 'GPS off' : 'Good'} color={flags.gpsDisabled ? colors.danger : colors.success} />
        <StatMini label="Offline" value={flags.offlineSaving ? '3 queued' : '0'} />
        <StatMini
          label="Battery"
          value={flags.lowBattery ? '14%' : '68%'}
          color={flags.lowBattery ? colors.warning : colors.text}
        />
      </StatGrid>
    </Stack>
  );
}
