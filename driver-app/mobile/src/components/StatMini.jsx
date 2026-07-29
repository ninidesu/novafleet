import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';

export function StatMini({ label, value, color }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: radius.sm, padding: 10, rowGap: 3 }}>
      <Text style={{ color: colors.muted, fontFamily: fontFamily.bodyBold, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </Text>
      <Text style={{ color: color || colors.text, fontFamily: fontFamily.display, fontSize: 14 }}>{value}</Text>
    </View>
  );
}

export function StatGrid({ children }) {
  return <View style={{ flexDirection: 'row', columnGap: 8 }}>{children}</View>;
}
