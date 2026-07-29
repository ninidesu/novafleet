import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';
import { TRACKING_REASONS } from '../data/mockData';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, Card, H1, BodyText, Muted, Pill } from '../components/ui';
import { SelectField } from '../components/FormFields';
import { CheckboxRow } from '../components/FormFields';
import Button from '../components/Button';
import Banner from '../components/Banner';

const METHODS = [
  { id: 'iot', title: 'IoT tracker', desc: 'Vehicle device', requiresOnline: true },
  { id: 'mobile', title: 'Phone GPS', desc: 'Use this phone' },
  { id: 'fallback', title: 'Mobile backup', desc: 'IoT unavailable' },
];

export default function TrackingMethodScreen({ navigation }) {
  const { colors } = useTheme();
  const { flags, startTrip } = useAppState();
  const iotOk = !flags.iotOffline;
  const [method, setMethod] = useState(null);
  const [reason, setReason] = useState(TRACKING_REASONS[1]);
  const [confirmed, setConfirmed] = useState(true);

  return (
    <ScreenContainer>
      <H1 style={{ fontSize: 17 }}>Tracking method</H1>
      <Card padding="sm">
        <Row>
          <BodyText size={12}>IoT status</BodyText>
          <Pill label={iotOk ? 'Online' : 'Offline'} bg={iotOk ? colors.successBg : colors.dangerBg} fg={iotOk ? colors.success : colors.danger} />
        </Row>
      </Card>

      <Stack>
        {METHODS.map((m) => {
          const enabled = !m.requiresOnline || iotOk;
          const selected = method === m.id;
          return (
            <Pressable key={m.id} disabled={!enabled} onPress={() => setMethod(m.id)}>
              <Card
                padding="sm"
                style={{
                  opacity: enabled ? 1 : 0.5,
                  borderColor: selected ? colors.accent : colors.line,
                  backgroundColor: selected ? colors.accentDim : colors.panel,
                }}
              >
                <Row>
                  <View>
                    <BodyText bold size={13}>
                      {m.title}
                    </BodyText>
                    <Muted>{m.desc}</Muted>
                  </View>
                  <View
                    style={{
                      width: 19,
                      height: 19,
                      borderRadius: 99,
                      borderWidth: 2,
                      borderColor: selected ? colors.accent : colors.line,
                      backgroundColor: selected ? colors.accent : 'transparent',
                    }}
                  />
                </Row>
              </Card>
            </Pressable>
          );
        })}
      </Stack>

      {method && method !== 'iot' && (
        <SelectField label="Reason" value={reason} onChange={setReason} options={TRACKING_REASONS} />
      )}

      <CheckboxRow label="Confirm tracking method" checked={confirmed} onToggle={() => setConfirmed((c) => !c)} />

      {method && method !== 'iot' && <Banner kind="info" icon="bell" text="Administrator will be notified." />}

      <Button
        label="Start trip"
        disabled={!method || !confirmed}
        onPress={() => {
          startTrip(method, method !== 'iot' ? reason : null);
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }}
      />
    </ScreenContainer>
  );
}
