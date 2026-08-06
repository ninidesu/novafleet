import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../state/AppStateContext';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, H1, BodyText, Muted, StatusBadge, EmptyState } from '../components/ui';
import SegmentedControl from '../components/SegmentedControl';
import ExpandableRow from '../components/ExpandableRow';
import Icon from '../theme/icons';

function dateLabel(iso) {
  if (!iso) return 'Not recorded';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { assignments } = useAppState();
  const [tab, setTab] = useState('Trips');
  const trips = assignments.history || [];

  return (
    <ScreenContainer>
      <H1>History</H1>
      <SegmentedControl options={['Trips', 'Fuel records']} value={tab} onChange={setTab} />

      {tab === 'Trips' ? (
        trips.length === 0 ? (
          <EmptyState icon={<Icon name="calendar" size={20} color={colors.muted} />} title="No completed trips yet." />
        ) : (
          <Stack>
            {trips.map((t) => (
              <ExpandableRow
                key={t.id}
                variant="card"
                summary={
                  <Stack gap={6}>
                    <Row>
                      <BodyText bold size={12.5}>{t.route}</BodyText>
                      <StatusBadge status={t.status} />
                    </Row>
                    <Row>
                      <Muted>{dateLabel(t.endTime || t.dispatchTime)} · {t.vehicle}</Muted>
                    </Row>
                  </Stack>
                }
                body={<Muted>{t.tripCode} · {t.purpose}</Muted>}
              />
            ))}
          </Stack>
        )
      ) : (
        <EmptyState icon={<Icon name="droplet" size={20} color={colors.muted} />} title="Fuel history coming soon." />
      )}
    </ScreenContainer>
  );
}
