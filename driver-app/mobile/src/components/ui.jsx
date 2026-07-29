import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius, spacing, STATUS_COLORS } from '../theme/tokens';

export function Stack({ gap = spacing.sm, style, children }) {
  return <View style={[{ rowGap: gap }, style]}>{children}</View>;
}

export function Row({ gap = spacing.sm, align = 'center', justify = 'space-between', style, children }) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: align, justifyContent: justify, columnGap: gap },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Card({ padding = 'normal', style, children }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.lg,
          padding: padding === 'sm' ? 11 : 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ style }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.lineSoft }, style]} />;
}

export function H1({ children, style }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.h1, { color: colors.text, fontFamily: fontFamily.display }, style]}>{children}</Text>
  );
}

export function H2({ children, style }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.h2, { color: colors.text, fontFamily: fontFamily.displaySemibold }, style]}>
      {children}
    </Text>
  );
}

export function Eyebrow({ children, style }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.eyebrow, { color: colors.accent, fontFamily: fontFamily.bodyBold }, style]}>
      {children}
    </Text>
  );
}

export function Muted({ children, style, size = 12 }) {
  const { colors } = useTheme();
  return (
    <Text style={[{ color: colors.muted, fontFamily: fontFamily.body, fontSize: size }, style]}>{children}</Text>
  );
}

export function BodyText({ children, style, size = 13, bold, semibold }) {
  const { colors } = useTheme();
  const family = bold ? fontFamily.bodyBold : semibold ? fontFamily.bodySemibold : fontFamily.body;
  return <Text style={[{ color: colors.text, fontFamily: family, fontSize: size }, style]}>{children}</Text>;
}

export function Avatar({ initials, size = 38 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: '#DCE8FF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#1D4ED8', fontFamily: fontFamily.displaySemibold, fontSize: size * 0.34 }}>
        {initials}
      </Text>
    </View>
  );
}

export function IconBox({ children, size = 36, bg, style }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.sm,
          backgroundColor: bg || colors.lineSoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Pill({ label, bg, fg }) {
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full }}>
      <Text style={{ color: fg, fontFamily: fontFamily.bodyBold, fontSize: 10.5 }}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  const { colors } = useTheme();
  const def = STATUS_COLORS[status] || { bg: 'lineSoft', fg: 'muted' };
  return <Pill label={status} bg={colors[def.bg]} fg={colors[def.fg]} />;
}

export function EmptyState({ icon, title, action }) {
  const { colors } = useTheme();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 32, gap: spacing.sm }}>
      <IconBox size={48} style={{ borderRadius: radius.xl }}>
        {icon}
      </IconBox>
      <BodyText size={13} bold>
        {title}
      </BodyText>
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 20, letterSpacing: -0.2 },
  h2: { fontSize: 15 },
  eyebrow: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
});
