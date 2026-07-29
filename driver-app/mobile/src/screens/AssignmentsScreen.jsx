import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../state/AppStateContext';
import { ASSIGNMENTS } from '../data/mockData';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, Card, H1, BodyText, StatusBadge, EmptyState } from '../components/ui';
import TabPills from '../components/TabPills';
import Button from '../components/Button';
import Icon from '../theme/icons';

const TABS = ['Today', 'Upcoming', 'Completed', 'Cancelled'];

export default function AssignmentsScreen({ navigation }) {
  const { colors } = useTheme();
  const { flags } = useAppState();
  const [tab, setTab] = useState('Today');
  const items = ASSIGNMENTS[tab] || [];

  return (
    <ScreenContainer>
      <H1>Assignments</H1>
      <TabPills options={TABS} value={tab} onChange={setTab} />

      {flags.assignEmpty || items.length === 0 ? (
        <EmptyState
          icon={<Icon name="calendar" size={20} color={colors.muted} />}
          title="No trips found."
          action={<Button label="Refresh" size="sm" variant="secondary" icon={<Icon name="refresh" size={14} color={colors.text} />} onPress={() => {}} />}
        />
      ) : (
        <Stack>
          {items.map((a, i) => (
            <Pressable key={i} onPress={() => navigation.navigate('TripDetails')}>
              <Card padding="sm" style={{ rowGap: 6 }}>
                <Row>
                  <BodyText bold size={13}>
                    {a.route}
                  </BodyText>
                  <StatusBadge status={a.status} />
                </Row>
                <Row>
                  <BodyText size={11.5} style={{ color: colors.muted }}>
                    {a.time}
                  </BodyText>
                  <BodyText size={11.5} style={{ color: colors.muted }}>
                    {a.vehicle}
                  </BodyText>
                </Row>
              </Card>
            </Pressable>
          ))}
        </Stack>
      )}
    </ScreenContainer>
  );
}
