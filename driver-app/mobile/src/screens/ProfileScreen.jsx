import React, { useState } from 'react';
import { View, Switch } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, Card, Avatar, BodyText, Muted, Pill, Eyebrow } from '../components/ui';
import Button from '../components/Button';
import Icon from '../theme/icons';
import ExpandableRow from '../components/ExpandableRow';

function SettingsRow({ icon, label, right, warn }) {
  const { colors } = useTheme();
  return (
    <Card padding="sm" style={{ rowGap: 6 }}>
      <Row>
        <Row gap={9} style={{ flex: 1 }}>
          <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={15} color={colors.text} />
          </View>
          <BodyText bold size={12.5}>
            {label}
          </BodyText>
        </Row>
        {right || <Icon name="chevronRight" size={15} color={colors.muted} />}
      </Row>
      {warn && (
        <BodyText size={11.5} style={{ color: colors.danger }}>
          {warn}
        </BodyText>
      )}
    </Card>
  );
}

function AllowedPill({ allowed }) {
  const { colors } = useTheme();
  return allowed ? (
    <Pill label="Allowed" bg={colors.successBg} fg={colors.success} />
  ) : (
    <Pill label="Off" bg={colors.dangerBg} fg={colors.danger} />
  );
}

const FLAG_TOGGLES = [
  ['iotOffline', 'IoT tracker offline'],
  ['gpsDisabled', 'GPS disabled'],
  ['bgLocationDisabled', 'Background GPS disabled'],
  ['lowBattery', 'Low battery'],
  ['noInternet', 'No internet'],
  ['offlineSaving', 'Saving offline'],
  ['syncing', 'Synchronizing'],
  ['trackingInterrupted', 'Tracking interrupted'],
  ['routeDeviation', 'Route deviation'],
  ['homeEmpty', 'No trips (Home)'],
  ['assignEmpty', 'No trips (Assignments)'],
];

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { driver, flags, toggleFlag, logout } = useAppState();
  const [devOpen, setDevOpen] = useState(false);

  return (
    <ScreenContainer>
      <Card padding="sm">
        <Row>
          <Avatar initials={driver.initials} size={50} />
          <View style={{ flex: 1 }}>
            <BodyText bold size={14}>
              {driver.name}
            </BodyText>
            <Muted>
              {driver.status} · {driver.branch}
            </Muted>
          </View>
        </Row>
      </Card>

      <Card padding="sm">
        <ExpandableRow
          label="Personal details"
          last
          body={
            <Stack gap={6}>
              <Row>
                <Muted>Phone</Muted>
                <BodyText size={12} bold>
                  {driver.phone}
                </BodyText>
              </Row>
              <Row>
                <Muted>Account status</Muted>
                <BodyText size={12} bold style={{ color: colors.success }}>
                  Active
                </BodyText>
              </Row>
            </Stack>
          }
        />
      </Card>

      <SettingsRow icon="phoneIcon" label="Registered phone" right={<Muted>{driver.device}</Muted>} />
      <SettingsRow icon="lock" label="Change password" />
      <SettingsRow
        icon="mapPin"
        label="Location"
        right={<AllowedPill allowed={!flags.gpsDisabled} />}
        warn={flags.gpsDisabled ? 'Allow location in Settings.' : null}
      />
      <SettingsRow
        icon="checkCircle"
        label="Background GPS"
        right={<AllowedPill allowed={!flags.bgLocationDisabled} />}
        warn={flags.bgLocationDisabled ? 'Allow in Settings.' : null}
      />
      <SettingsRow icon="bell" label="Notifications" right={<AllowedPill allowed />} />
      <SettingsRow icon="camera" label="Camera" right={<AllowedPill allowed />} />
      <SettingsRow
        icon="refresh"
        label="Sync"
        right={
          flags.syncing ? (
            <Pill label="Pending" bg={colors.warningBg} fg={colors.warning} />
          ) : (
            <Pill label="Up to date" bg={colors.successBg} fg={colors.success} />
          )
        }
      />
      <SettingsRow icon="idCard" label="Privacy" />
      <SettingsRow icon="idCard" label="Terms" />

      <Row>
        <BodyText size={12} bold>
          Dark mode
        </BodyText>
        <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.accent }} />
      </Row>

      <Muted style={{ textAlign: 'center' }}>v2.4.1</Muted>

      <Button
        label="Sign out"
        variant="outlineDanger"
        icon={<Icon name="logout" size={16} color={colors.danger} />}
        onPress={logout}
      />

      <Card padding="sm" style={{ borderStyle: 'dashed' }}>
        <Row>
          <Eyebrow>Developer preview</Eyebrow>
          <Button
            label={devOpen ? 'Hide' : 'Show'}
            size="sm"
            variant="ghost"
            onPress={() => setDevOpen((v) => !v)}
            style={{ backgroundColor: 'transparent', minHeight: 0, paddingHorizontal: 0 }}
          />
        </Row>
        {devOpen && (
          <Stack gap={10} style={{ marginTop: 8 }}>
            <Muted size={11}>
              Simulates device and connectivity states until real sensors and backend are wired up.
            </Muted>
            {FLAG_TOGGLES.map(([key, label]) => (
              <Row key={key}>
                <BodyText size={12}>{label}</BodyText>
                <Switch value={flags[key]} onValueChange={() => toggleFlag(key)} trackColor={{ true: colors.accent }} />
              </Row>
            ))}
          </Stack>
        )}
      </Card>
    </ScreenContainer>
  );
}
