import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import Icon from '../theme/icons';

export default function QuickAction({ icon, label, onPress, sos }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        rowGap: 6,
        paddingVertical: 10,
        paddingHorizontal: 2,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: sos ? '#F3B4B4' : colors.line,
        backgroundColor: colors.panel,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: sos ? colors.dangerBg : colors.accentDim,
        }}
      >
        <Icon name={icon} size={17} color={sos ? colors.danger : colors.accent} />
      </View>
      <Text style={{ color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 10, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function QuickActionGrid({ children }) {
  return <View style={{ flexDirection: 'row', columnGap: 8 }}>{children}</View>;
}
