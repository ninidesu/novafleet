import React, { useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, Card, BodyText, Muted, H2 } from '../components/ui';
import Button, { ButtonRow } from '../components/Button';
import Banner from '../components/Banner';
import Icon from '../theme/icons';

const HOLD_MS = 1200;
const TICK_MS = 40;

export default function SosScreen({ navigation }) {
  const { colors } = useTheme();
  const { driver, sosConfirmed, confirmSos, resetSos } = useAppState();
  const [progress, setProgress] = useState(0);
  const timer = useRef(null);

  const startHold = () => {
    setProgress(0);
    const step = (100 * TICK_MS) / HOLD_MS;
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + step;
        if (next >= 100) {
          clearInterval(timer.current);
          confirmSos();
          return 100;
        }
        return next;
      });
    }, TICK_MS);
  };

  const cancelHold = () => {
    if (timer.current) clearInterval(timer.current);
    setProgress(0);
  };

  if (sosConfirmed) {
    return (
      <ScreenContainer>
        <Stack gap={12} style={{ alignItems: 'center', paddingTop: 20 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="checkCircle" size={26} color={colors.danger} />
          </View>
          <H2>SOS sent.</H2>
          <Muted>Help has been notified.</Muted>
          <Button
            label="Back to trip"
            variant="secondary"
            onPress={() => {
              resetSos();
              navigation.navigate('MainTabs', { screen: 'Home' });
            }}
            style={{ width: '100%' }}
          />
        </Stack>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack gap={16} style={{ alignItems: 'center' }}>
        <Banner kind="danger" icon="alertTriangle" text="Sends your location to dispatch." />

        <Pressable
          onPressIn={startHold}
          onPressOut={cancelHold}
          accessibilityRole="button"
          accessibilityLabel="Hold to send SOS"
          accessibilityHint="Hold for just over one second to alert dispatch with your location."
        >
          <View
            style={{
              width: 150,
              height: 150,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: '#F3B4B4',
              backgroundColor: colors.dangerBg,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${progress}%`,
                backgroundColor: colors.danger,
                opacity: 0.28,
              }}
            />
            <Text style={{ color: colors.danger, fontFamily: fontFamily.display, fontSize: 16, textAlign: 'center' }}>
              HOLD{'\n'}TO SEND
            </Text>
          </View>
        </Pressable>

        <Card padding="sm" style={{ width: '100%', rowGap: 8 }}>
          <Row>
            <Muted>Driver</Muted>
            <BodyText size={12} bold>
              {driver.name}
            </BodyText>
          </Row>
          <Row>
            <Muted>Vehicle</Muted>
            <BodyText size={12} bold>
              KDG 214P
            </BodyText>
          </Row>
          <Row>
            <Muted>Location</Muted>
            <BodyText size={12} bold>
              Auto-captured
            </BodyText>
          </Row>
        </Card>

        <ButtonRow>
          <Button label="Cancel" variant="secondary" onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })} style={{ flex: 1 }} />
          <Button label="Call" variant="outlineDanger" icon={<Icon name="phoneIcon" size={15} color={colors.danger} />} onPress={() => {}} style={{ flex: 1 }} />
        </ButtonRow>
      </Stack>
    </ScreenContainer>
  );
}
