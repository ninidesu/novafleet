import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { NEXT_TRIP } from '../data/mockData';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, Card, Eyebrow, H1, StatusBadge, BodyText } from '../components/ui';
import Button, { ButtonRow } from '../components/Button';
import Icon from '../theme/icons';
import ExpandableRow from '../components/ExpandableRow';
import { useAppState } from '../state/AppStateContext';

function InfoRow({ label, value }) {
  const { colors } = useTheme();
  return (
    <Row>
      <BodyText size={12} style={{ color: colors.muted }}>
        {label}
      </BodyText>
      <BodyText size={12} bold style={{ textAlign: 'right' }}>
        {value}
      </BodyText>
    </Row>
  );
}

export default function TripDetailsScreen({ navigation }) {
  const { colors } = useTheme();
  const { showToast } = useAppState();

  return (
    <ScreenContainer>
      <Row>
        <Eyebrow>{NEXT_TRIP.ref}</Eyebrow>
        <StatusBadge status={NEXT_TRIP.status} />
      </Row>
      <H1 style={{ fontSize: 17 }}>{NEXT_TRIP.route}</H1>

      <View
        style={{
          height: 170,
          borderRadius: radius.lg,
          backgroundColor: colors.accentDim,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      />

      <Card padding="sm" style={{ rowGap: 10 }}>
        <InfoRow label="Schedule" value={NEXT_TRIP.schedule} />
        <InfoRow label="Vehicle" value={NEXT_TRIP.vehicle} />
        <InfoRow label="Purpose" value={NEXT_TRIP.purpose} />
        <InfoRow label="Tracking" value={NEXT_TRIP.tracking} />
        <InfoRow label="Contact" value={NEXT_TRIP.contactName} />
      </Card>

      <Card padding="sm">
        <ExpandableRow label="Instructions" body={<BodyText size={11.5} style={{ color: colors.muted, lineHeight: 17 }}>{NEXT_TRIP.instructions}</BodyText>} />
        <ExpandableRow label="Evidence needed" body={<BodyText size={11.5} style={{ color: colors.muted, lineHeight: 17 }}>{NEXT_TRIP.evidence}</BodyText>} />
        <ExpandableRow
          label="Contact"
          last
          body={
            <BodyText size={11.5} style={{ color: colors.muted, lineHeight: 17 }}>
              {NEXT_TRIP.contactName}, {NEXT_TRIP.contactRole}
              {'\n'}
              {NEXT_TRIP.contactPhone}
            </BodyText>
          }
        />
      </Card>

      <Button label="Start checklist" onPress={() => navigation.navigate('Pretrip')} />
      <ButtonRow>
        <Button label="Open Maps" variant="secondary" icon={<Icon name="mapPin" size={15} color={colors.text} />} onPress={() => showToast('info', 'mapPin', 'Route opened in Maps.')} style={{ flex: 1 }} />
        <Button label="Report issue" variant="secondary" icon={<Icon name="alertTriangle" size={15} color={colors.text} />} onPress={() => navigation.navigate('Incident')} style={{ flex: 1 }} />
      </ButtonRow>
    </ScreenContainer>
  );
}
