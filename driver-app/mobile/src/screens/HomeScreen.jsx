import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';
import ScreenContainer from '../components/ScreenContainer';
import { Row, Card, H1, H2, Muted, BodyText, Avatar, Pill, StatusBadge, EmptyState, IconBox } from '../components/ui';
import { StatMini, StatGrid } from '../components/StatMini';
import Button, { ButtonRow } from '../components/Button';
import Icon from '../theme/icons';
import ActiveTripView from './ActiveTripView';

function whenLabel(iso) {
  if (!iso) return 'Scheduled';
  return new Date(iso).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

function todayLabel() {
  return new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { driver, flags, tripActive, nextTrip, reloadData } = useAppState();

  // Show the in-progress view when a trip is active (started locally, or the
  // driver already has an active assignment on the server).
  if (tripActive || nextTrip?.state === 'active') {
    return <ScreenContainer><ActiveTripView navigation={navigation} /></ScreenContainer>;
  }

  const showTrip = nextTrip && !flags.homeEmpty;

  return (
    <ScreenContainer>
      <Row>
        <View>
          <H1>Good day, {driver.name.split(' ')[0]}</H1>
          <Muted>{todayLabel()} · {driver.branch}</Muted>
        </View>
        <Avatar initials={driver.initials} />
      </Row>

      {showTrip ? (
        <View style={{ borderRadius: radius.lg, padding: 14, backgroundColor: colors.navy, rowGap: 10 }}>
          <Row>
            <Pill label={nextTrip.state === 'active' ? 'Active trip' : 'Next trip'} bg="rgba(255,255,255,0.16)" fg="#fff" />
            <StatusBadge status={nextTrip.status} />
          </Row>
          <BodyText style={{ color: '#fff', fontFamily: fontFamily.bodySemibold, fontSize: 15 }}>{nextTrip.route}</BodyText>
          <BodyText style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11.5 }}>
            {whenLabel(nextTrip.dispatchTime)} · {nextTrip.vehicle}
          </BodyText>
          <Button
            label="View trip"
            onPress={() => navigation.navigate('TripDetails', { tripId: nextTrip.id })}
            style={{ backgroundColor: '#fff', borderColor: '#fff' }}
          />
        </View>
      ) : (
        <EmptyState
          icon={<Icon name="assignments" size={20} color={colors.muted} />}
          title="No trips assigned."
          action={<Button label="Refresh" size="sm" variant="secondary" icon={<Icon name="refresh" size={14} color={colors.text} />} onPress={reloadData} />}
        />
      )}

      <StatGrid>
        <StatMini label="Vehicle" value={driver.vehicle?.plateNumber || nextTrip?.vehicle || 'Unassigned'} />
        <StatMini
          label="Tracking"
          value={flags.iotOffline ? 'Tracker offline' : 'IoT active'}
          color={flags.iotOffline ? colors.danger : colors.success}
        />
      </StatGrid>

      <ButtonRow>
        <Button label="Fuel" variant="secondary" icon={<Icon name="droplet" size={15} color={colors.text} />} onPress={() => navigation.navigate('Fuel')} style={{ flex: 1 }} />
        <Button label="SOS" variant="outlineDanger" icon={<Icon name="shield" size={15} color={colors.danger} />} onPress={() => navigation.navigate('Sos')} style={{ flex: 1 }} />
      </ButtonRow>

      <View>
        <Row>
          <H2>Recent alerts</H2>
          <Button label="View all" variant="ghost" size="sm" onPress={() => navigation.navigate('Notifications')} style={{ backgroundColor: 'transparent', minHeight: 0, paddingHorizontal: 0 }} />
        </Row>
        <Card padding="sm" style={{ marginTop: 8, rowGap: 10 }}>
          <Row>
            <IconBox bg={colors.accentDim}>
              <Icon name="assignments" size={16} color={colors.accent} />
            </IconBox>
            <View style={{ flex: 1 }}>
              <BodyText bold size={12.5}>Trips and alerts</BodyText>
              <Muted>Open Notifications to see recent activity</Muted>
            </View>
          </Row>
        </Card>
      </View>
    </ScreenContainer>
  );
}
