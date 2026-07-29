import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import Icon from '../theme/icons';
import ScreenContainer from '../components/ScreenContainer';
import { Card, Row, Stack, Avatar, Eyebrow, Muted, BodyText, Pill } from '../components/ui';
import { TextField, SelectField } from '../components/FormFields';
import Button from '../components/Button';
import Banner from '../components/Banner';
import { DRIVER } from '../data/mockData';

const STEPS = ['Confirm account', 'New password', 'Register phone', 'Permissions', 'Device test'];

const PERMISSIONS = [
  { icon: 'mapPin', title: 'Precise location', desc: 'Track your trip' },
  { icon: 'checkCircle', title: 'Background location', desc: 'Track while minimized' },
  { icon: 'bell', title: 'Notifications', desc: 'Receive trip alerts' },
  { icon: 'camera', title: 'Camera', desc: 'Capture receipts' },
];

export default function SetupScreen({ navigation }) {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [permission, setPermission] = useState('granted'); // granted | denied — simulated for now

  const next = () => setStep((s) => Math.min(4, s + 1));

  return (
    <ScreenContainer>
      <Row>
        <Eyebrow>Step {step + 1} of 5</Eyebrow>
        <Muted>{STEPS[step]}</Muted>
      </Row>
      <View style={{ height: 4, backgroundColor: colors.lineSoft, borderRadius: 99, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${((step + 1) / 5) * 100}%`, backgroundColor: colors.accent }} />
      </View>

      {step === 0 && (
        <Stack gap={14}>
          <Card padding="sm">
            <Row>
              <Avatar initials={DRIVER.initials} />
              <View style={{ flex: 1 }}>
                <BodyText bold size={13}>
                  {DRIVER.name}
                </BodyText>
                <Muted>
                  {DRIVER.id} · {DRIVER.branch}
                </Muted>
              </View>
            </Row>
          </Card>
          <Muted size={13}>Is this your account?</Muted>
          <Button label="Confirm" onPress={next} />
        </Stack>
      )}

      {step === 1 && (
        <Stack gap={14}>
          <TextField label="Temporary password" value="********" secure disabled />
          <TextField label="New password" placeholder="Min 8 characters" secure value="" onChangeText={() => {}} />
          <TextField label="Confirm password" placeholder="Re-enter password" secure value="" onChangeText={() => {}} />
          <Button label="Set password" onPress={next} />
        </Stack>
      )}

      {step === 2 && (
        <Stack gap={14}>
          <Card padding="sm" style={{ rowGap: 10 }}>
            <Row>
              <Muted>Device</Muted>
              <BodyText size={12} bold>
                {DRIVER.device}
              </BodyText>
            </Row>
            <Row>
              <Muted>Account</Muted>
              <BodyText size={12} bold>
                {DRIVER.id}
              </BodyText>
            </Row>
          </Card>
          <Muted size={13}>This phone tracks active trips only.</Muted>
          {permission === 'denied' && <Banner kind="danger" icon="xCircle" text="Registration failed. Try again." />}
          <Button label="Register phone" icon={<Icon name="idCard" size={16} color="#fff" />} onPress={next} />
        </Stack>
      )}

      {step === 3 && (
        <Stack gap={10}>
          {PERMISSIONS.map((p) => (
            <Card key={p.title} padding="sm">
              <Row>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.accentDim,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={p.icon} size={17} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <BodyText bold size={12.5}>
                    {p.title}
                  </BodyText>
                  <Muted>{p.desc}</Muted>
                </View>
                {permission === 'denied' ? (
                  <Pill label="Rejected" bg={colors.dangerBg} fg={colors.danger} />
                ) : (
                  <Pill label="Approved" bg={colors.successBg} fg={colors.success} />
                )}
              </Row>
            </Card>
          ))}
          {permission === 'denied' && <Banner kind="danger" icon="alertTriangle" text="Allow permissions to continue." />}
          <Button label={permission === 'denied' ? 'Open settings' : 'Continue'} onPress={next} />
        </Stack>
      )}

      {step === 4 && (
        <Stack gap={14}>
          <View
            style={{
              height: 150,
              borderRadius: 14,
              backgroundColor: colors.accentDim,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          />
          <Stack>
            <Card padding="sm">
              <Row>
                <Muted>GPS</Muted>
                {permission === 'denied' ? (
                  <Pill label="Off" bg={colors.dangerBg} fg={colors.danger} />
                ) : (
                  <Pill label="Strong" bg={colors.successBg} fg={colors.success} />
                )}
              </Row>
            </Card>
            <Card padding="sm">
              <Row>
                <Muted>Internet</Muted>
                <Pill label="Connected" bg={colors.successBg} fg={colors.success} />
              </Row>
            </Card>
            <Card padding="sm">
              <Row>
                <Muted>Background tracking</Muted>
                {permission === 'denied' ? (
                  <Pill label="Failed" bg={colors.dangerBg} fg={colors.danger} />
                ) : (
                  <Pill label="Passed" bg={colors.successBg} fg={colors.success} />
                )}
              </Row>
            </Card>
          </Stack>
          {permission === 'denied' ? (
            <Banner kind="danger" icon="gps" text="Turn on GPS." />
          ) : (
            <Banner kind="success" icon="checkCircle" text="Setup complete." />
          )}
          <Button
            label={permission === 'denied' ? 'Retry' : 'Go to Home'}
            onPress={() => {
              if (permission === 'denied') return;
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }}
          />
        </Stack>
      )}

      <Pressable
        onPress={() => setPermission((p) => (p === 'granted' ? 'denied' : 'granted'))}
        style={{
          alignSelf: 'center',
          marginTop: 4,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.line,
          borderStyle: 'dashed',
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 10, fontFamily: fontFamily.bodyBold }}>
          Preview: {permission === 'granted' ? 'simulate denied / GPS off' : 'reset to granted'}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
