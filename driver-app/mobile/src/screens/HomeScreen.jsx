import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';
import { NEXT_TRIP } from '../data/mockData';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, Card, H1, H2, Muted, BodyText, Avatar, Pill, StatusBadge, EmptyState, IconBox } from '../components/ui';
import { StatMini, StatGrid } from '../components/StatMini';
import Button, { ButtonRow } from '../components/Button';
import Icon from '../theme/icons';
import ActiveTripView from './ActiveTripView';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { driver, flags, tripActive } = useAppState();

  if (tripActive) return <ScreenContainer><ActiveTripView navigation={navigation} /></ScreenContainer>;

  return (
    <ScreenContainer>
      <Row>
        <View>
          <H1>Good morning, {driver.name.split(' ')[0]}</H1>
          <Muted>Tue, 29 Jul · {driver.branch}</Muted>
        </View>
        <Avatar initials={driver.initials} />
      </Row>

      {!flags.homeEmpty && (
        <View
          style={{
            borderRadius: radius.lg,
            padding: 14,
            backgroundColor: colors.navy,
            rowGap: 10,
          }}
        >
          <Row>
            <Pill label="Next trip" bg="rgba(255,255,255,0.16)" fg="#fff" />
            <StatusBadge status="Ready" />
          </Row>
          <BodyText style={{ color: '#fff', fontFamily: fontFamily.bodySemibold, fontSize: 15 }}>{NEXT_TRIP.route}</BodyText>
          <BodyText style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11.5 }}>
            {NEXT_TRIP.time} · {NEXT_TRIP.vehiclePlate}
          </BodyText>
          <Button
            label="View trip"
            onPress={() => navigation.navigate('TripDetails')}
            style={{ backgroundColor: '#fff', borderColor: '#fff' }}
          />
        </View>
      )}

      {flags.homeEmpty && (
        <EmptyState
          icon={<Icon name="assignments" size={20} color={colors.muted} />}
          title="No trips assigned."
          action={<Button label="Refresh" size="sm" variant="secondary" icon={<Icon name="refresh" size={14} color={colors.text} />} onPress={() => {}} />}
        />
      )}

      <StatGrid>
        <StatMini label="Vehicle" value={NEXT_TRIP.vehiclePlate} />
        <StatMini
          label="Tracking"
          value={flags.iotOffline ? 'Tracker offline' : 'IoT active'}
          color={flags.iotOffline ? colors.danger : colors.success}
        />
      </StatGrid>

      <ButtonRow>
        <Button
          label="Fuel"
          variant="secondary"
          icon={<Icon name="droplet" size={15} color={colors.text} />}
          onPress={() => navigation.navigate('Fuel')}
          style={{ flex: 1 }}
        />
        <Button
          label="SOS"
          variant="outlineDanger"
          icon={<Icon name="shield" size={15} color={colors.danger} />}
          onPress={() => navigation.navigate('Sos')}
          style={{ flex: 1 }}
        />
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
              <BodyText bold size={12.5}>
                New trip assigned
              </BodyText>
              <Muted>TRP-58291 · 8 min ago</Muted>
            </View>
          </Row>
          <Row>
            <IconBox bg={colors.warningBg}>
              <Icon name="alertTriangle" size={16} color={colors.warning} />
            </IconBox>
            <View style={{ flex: 1 }}>
              <BodyText bold size={12.5}>
                Fuel record pending
              </BodyText>
              <Muted>Yesterday, 17:40</Muted>
            </View>
          </Row>
        </Card>
      </View>
    </ScreenContainer>
  );
}
