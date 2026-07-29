import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../state/AppStateContext';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, Card, H2, Muted, BodyText } from '../components/ui';
import Button, { ButtonRow } from '../components/Button';
import Icon from '../theme/icons';
import ExpandableRow from '../components/ExpandableRow';

function SummaryRow({ label, value, valueColor }) {
  const { colors } = useTheme();
  return (
    <Row>
      <Muted>{label}</Muted>
      <BodyText size={12} bold style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </BodyText>
    </Row>
  );
}

export default function TripSummaryScreen({ navigation }) {
  const { colors } = useTheme();
  const { lastCompletedTrip } = useAppState();
  const pending = !!lastCompletedTrip?.pendingSync;
  const fuel = lastCompletedTrip?.fuelRecords?.length
    ? lastCompletedTrip.fuelRecords.map((r) => r.liters).join(', ')
    : '32.5 L';
  const incidents = lastCompletedTrip?.incidents?.length ?? 0;

  return (
    <ScreenContainer>
      <Stack gap={14} style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: colors.successBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="checkCircle" size={26} color={colors.success} />
        </View>
        <H2>{pending ? 'Trip complete' : 'Trip completed'}</H2>
        {pending && <Muted>2 records syncing.</Muted>}

        <Card padding="sm" style={{ width: '100%', rowGap: 8 }}>
          <SummaryRow label="Duration" value="1h 44m" />
          <SummaryRow label="Distance" value="24.6 km" />
          <SummaryRow label="Fuel" value={fuel} />
          <SummaryRow label="Incidents" value={String(incidents)} />
          <SummaryRow label="Sync" value={pending ? 'Syncing' : 'Complete'} valueColor={pending ? colors.warning : colors.success} />
        </Card>

        <View style={{ width: '100%' }}>
          <ExpandableRow
            variant="link"
            body={
              <Stack gap={8}>
                <SummaryRow label="Route" value="Kitengela Branch → Machakos Circuit" />
                <SummaryRow label="Start / End" value="10:30 → 12:14" />
                <SummaryRow label="Tracking method" value="IoT device" />
                <SummaryRow label="Route deviation" value="None detected" />
                <SummaryRow label="Odometer" value="48,210 → 48,268 km" />
              </Stack>
            }
          />
        </View>

        <ButtonRow>
          <Button label="Home" variant="secondary" onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })} style={{ flex: 1 }} />
          <Button label="History" onPress={() => navigation.navigate('MainTabs', { screen: 'History' })} style={{ flex: 1 }} />
        </ButtonRow>
      </Stack>
    </ScreenContainer>
  );
}
