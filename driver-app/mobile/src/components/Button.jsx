import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';

const VARIANTS = {
  primary: (colors) => ({ bg: colors.accent, border: colors.accent, fg: '#fff' }),
  secondary: (colors) => ({ bg: colors.panel, border: colors.line, fg: colors.text }),
  ghost: (colors) => ({ bg: colors.lineSoft, border: 'transparent', fg: colors.text }),
  danger: (colors) => ({ bg: colors.danger, border: colors.danger, fg: '#fff' }),
  outlineDanger: (colors) => ({ bg: colors.panel, border: '#F3B4B4', fg: colors.danger }),
};

export default function Button({ label, onPress, variant = 'primary', icon, size = 'md', disabled, style, accessibilityHint }) {
  const { colors } = useTheme();
  const v = (VARIANTS[variant] || VARIANTS.primary)(colors);
  const minHeight = size === 'sm' ? 44 : 48;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        {
          minHeight,
          borderRadius: radius.md,
          backgroundColor: v.bg,
          borderWidth: 1,
          borderColor: v.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: 7,
          paddingHorizontal: 14,
          opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ color: v.fg, fontFamily: fontFamily.bodyBold, fontSize: size === 'sm' ? 12.5 : 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ButtonRow({ children }) {
  return <View style={{ flexDirection: 'row', columnGap: 8 }}>{children}</View>;
}
