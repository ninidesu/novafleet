import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import Icon from '../theme/icons';
import Button from '../components/Button';
import { Muted } from '../components/ui';

const VARIANTS = [
  { key: 'loading', label: 'Loading' },
  { key: 'no-internet', label: 'No internet' },
  { key: 'update-required', label: 'Update required' },
  { key: 'server-unavailable', label: 'Server unavailable' },
];

export default function SplashScreen({ navigation }) {
  const { colors } = useTheme();
  const [variant, setVariant] = useState('loading');

  useEffect(() => {
    if (variant !== 'loading') return;
    // Simulated session / connectivity check. Real device and session
    // checks (AsyncStorage session, network reachability) plug in here later.
    const t = setTimeout(() => navigation.replace('Login'), 1200);
    return () => clearTimeout(t);
  }, [variant, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {variant === 'loading' ? (
        <View style={{ alignItems: 'center', rowGap: 10 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: colors.navy,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="truck" size={30} color="#fff" />
          </View>
          <Text style={{ color: colors.text, fontFamily: fontFamily.display, fontSize: 20, marginTop: 8 }}>
            NovaFleet Driver
          </Text>
          <Muted>Driver App</Muted>
          <ActivityIndicator color={colors.accent} style={{ marginTop: 18 }} />
          <Muted style={{ marginTop: 10 }}>Loading…</Muted>
          <Muted style={{ marginTop: 50 }}>Version 2.4.1</Muted>
        </View>
      ) : (
        <SplashError variant={variant} onRetry={() => setVariant('loading')} colors={colors} />
      )}

      <View
        style={{
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          borderStyle: 'dashed',
          paddingTop: 10,
        }}
      >
        <Text style={{ color: colors.muted, fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1, marginBottom: 7 }}>
          PREVIEW STATE (PROTOTYPE CONTROL)
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 6 }}>
          {VARIANTS.map((v) => (
            <Pressable
              key={v.key}
              onPress={() => setVariant(v.key)}
              style={{
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: variant === v.key ? colors.navy : colors.panel,
              }}
            >
              <Text style={{ color: variant === v.key ? '#fff' : colors.muted, fontSize: 10.5, fontFamily: fontFamily.bodyBold }}>
                {v.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function SplashError({ variant, onRetry, colors }) {
  const copy = {
    'no-internet': { icon: 'wifiOff', message: 'Connect to the internet.', action: 'Retry' },
    'update-required': { icon: 'download', message: 'Update the app to continue.', action: 'Update' },
    'server-unavailable': { icon: 'alertTriangle', message: 'Server unavailable. Try again.', action: 'Try again' },
  }[variant];

  return (
    <View style={{ alignItems: 'center', rowGap: 14, width: '100%', maxWidth: 320 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.dangerBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={copy.icon} size={26} color={colors.danger} />
      </View>
      <Text style={{ color: colors.text, fontFamily: fontFamily.displaySemibold, fontSize: 15, textAlign: 'center' }}>
        {copy.message}
      </Text>
      <Button label={copy.action} onPress={onRetry} style={{ width: '100%' }} />
    </View>
  );
}
