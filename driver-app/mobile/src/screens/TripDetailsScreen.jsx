import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import ScreenContainer from '../components/ScreenContainer';
import { Row, Card, Eyebrow, H1, StatusBadge, BodyText, Muted, EmptyState } from '../components/ui';
import Button, { ButtonRow } from '../components/Button';
import Icon from '../theme/icons';
import TripMap from '../components/TripMap';
import { useAppState } from '../state/AppStateContext';
import { driverApi } from '../services/api';
import { openGoogleMapsNavigation } from '../lib/maps';

function InfoRow({ label, value }) {
  const { colors } = useTheme();
  return (
    <Row>
      <BodyText size={12} style={{ color: colors.muted }}>{label}</BodyText>
      <BodyText size={12} bold style={{ textAlign: 'right' }}>{value}</BodyText>
    </Row>
  );
}

function schedule(trip) {
  const d = trip.dispatchTime ? new Date(trip.dispatchTime).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : 'Not scheduled';
  return d;
}

export default function TripDetailsScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { showToast, nextTrip } = useAppState();
  const tripId = route?.params?.tripId || nextTrip?.id;

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!tripId) { setLoading(false); setError('No trip selected.'); return; }
    setLoading(true);
    driverApi
      .trip(tripId)
      .then((data) => { if (active) { setTrip(data); setError(''); } })
      .catch((e) => { if (active) setError(e.message || 'Unable to load trip.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tripId]);

  if (loading) {
    return <ScreenContainer><ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /></ScreenContainer>;
  }
  if (error || !trip) {
    return (
      <ScreenContainer>
        <EmptyState icon={<Icon name="alertTriangle" size={20} color={colors.muted} />} title={error || 'Trip not found.'} />
      </ScreenContainer>
    );
  }

  const canStart = trip.state === 'upcoming';

  return (
    <ScreenContainer>
      <Row>
        <Eyebrow>{trip.tripCode}</Eyebrow>
        <StatusBadge status={trip.status} />
      </Row>
      <H1 style={{ fontSize: 17 }}>{trip.route}</H1>

      <TripMap plannedRoute={trip.plannedRoute} path={trip.path} position={trip.position} height={200} />

      <Card padding="sm" style={{ rowGap: 10 }}>
        <InfoRow label="Schedule" value={schedule(trip)} />
        <InfoRow label="Vehicle" value={trip.vehicleModel ? `${trip.vehicle} · ${trip.vehicleModel}` : trip.vehicle} />
        <InfoRow label="Origin" value={trip.origin} />
        <InfoRow label="Destination" value={trip.destination} />
        <InfoRow label="Purpose" value={trip.purpose} />
      </Card>

      {trip.state === 'active' ? (
        <Muted style={{ textAlign: 'center' }}>This trip is in progress.</Muted>
      ) : null}

      {canStart ? (
        <Button label="Start checklist" onPress={() => navigation.navigate('Pretrip', { tripId: trip.id })} />
      ) : null}

      <ButtonRow>
        <Button label="Navigate" variant="secondary" icon={<Icon name="mapPin" size={15} color={colors.text} />} onPress={() => openGoogleMapsNavigation({ destinationCoord: trip.plannedRoute?.length ? trip.plannedRoute[trip.plannedRoute.length - 1] : null, destinationText: trip.destination })} style={{ flex: 1 }} />
        <Button label="Report issue" variant="secondary" icon={<Icon name="alertTriangle" size={15} color={colors.text} />} onPress={() => navigation.navigate('Incident')} style={{ flex: 1 }} />
      </ButtonRow>
    </ScreenContainer>
  );
}
