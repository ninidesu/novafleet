import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../state/AppStateContext';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, Card, H1, BodyText, StatusBadge, EmptyState } from '../components/ui';
import TabPills from '../components/TabPills';
import Button from '../components/Button';
import Icon from '../theme/icons';

const TABS = ['Today', 'Upcoming', 'Completed'];

function whenLabel(iso) {
  if (!iso) return 'Scheduled';
  return new Date(iso).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AssignmentsScreen({ navigation }) {
  const { colors } = useTheme();
  const { flags, assignments, reloadData } = useAppState();
  const [tab, setTab] = useState('Today');

  const byTab = {
    Today: assignments.active ? [assignments.active] : [],
    Upcoming: assignments.upcoming,
    Completed: assignments.history,
  };
  const items = byTab[tab] || [];

  return (
    <ScreenContainer>
      <H1>Assignments</H1>
      <TabPills options={TABS} value={tab} onChange={setTab} />

      {flags.assignEmpty || items.length === 0 ? (
        <EmptyState
          icon={<Icon name="calendar" size={20} color={colors.muted} />}
          title="No trips found."
          action={<Button label="Refresh" size="sm" variant="secondary" icon={<Icon name="refresh" size={14} color={colors.text} />} onPress={reloadData} />}
        />
      ) : (
        <Stack>
          {items.map((a) => (
            <Pressable key={a.id} onPress={() => navigation.navigate('TripDetails', { tripId: a.id })}>
              <Card padding="sm" style={{ rowGap: 6 }}>
                <Row>
                  <BodyText bold size={13}>{a.route}</BodyText>
                  <StatusBadge status={a.status} />
                </Row>
                <Row>
                  <BodyText size={11.5} style={{ color: colors.muted }}>{whenLabel(a.dispatchTime)}</BodyText>
                  <BodyText size={11.5} style={{ color: colors.muted }}>{a.vehicle}</BodyText>
                </Row>
              </Card>
            </Pressable>
          ))}
        </Stack>
      )}
    </ScreenContainer>
  );
}
