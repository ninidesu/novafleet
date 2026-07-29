import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TRIP_HISTORY, FUEL_RECORDS } from '../data/mockData';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, H1, BodyText, Muted, StatusBadge } from '../components/ui';
import SegmentedControl from '../components/SegmentedControl';
import ExpandableRow from '../components/ExpandableRow';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState('Trips');

  return (
    <ScreenContainer>
      <H1>History</H1>
      <SegmentedControl options={['Trips', 'Fuel records']} value={tab} onChange={setTab} />

      {tab === 'Trips' ? (
        <Stack>
          {TRIP_HISTORY.map((t, i) => (
            <ExpandableRow
              key={i}
              variant="card"
              summary={
                <Stack gap={6}>
                  <Row>
                    <BodyText bold size={12.5}>
                      {t.route}
                    </BodyText>
                    <StatusBadge status={t.status} />
                  </Row>
                  <Row>
                    <Muted>
                      {t.date} · {t.vehicle}
                    </Muted>
                    <Muted>{t.distance}</Muted>
                  </Row>
                </Stack>
              }
              body={
                <Muted>
                  {t.ref} · {t.tracking}
                </Muted>
              }
            />
          ))}
        </Stack>
      ) : (
        <Stack>
          {FUEL_RECORDS.map((r, i) => (
            <ExpandableRow
              key={i}
              variant="card"
              summary={
                <Stack gap={6}>
                  <Row>
                    <Muted>
                      {r.date} · {r.vehicle}
                    </Muted>
                    <StatusBadge status={r.status} />
                  </Row>
                  <Row>
                    <BodyText bold size={12.5}>
                      {r.liters}
                    </BodyText>
                    <BodyText bold size={12.5}>
                      {r.total}
                    </BodyText>
                  </Row>
                </Stack>
              }
              body={
                <View>
                  <Muted>Odometer {r.odo}</Muted>
                  {r.status === 'Rejected' && (
                    <BodyText size={11.5} style={{ color: colors.danger, marginTop: 4 }}>
                      Receipt unclear. Upload again.
                    </BodyText>
                  )}
                </View>
              }
            />
          ))}
        </Stack>
      )}
    </ScreenContainer>
  );
}
