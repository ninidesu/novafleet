import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import Icon from '../theme/icons';

const KIND_MAP = {
  warning: (c) => ({ bg: c.warningBg, fg: c.warning }),
  danger: (c) => ({ bg: c.dangerBg, fg: c.danger }),
  info: (c) => ({ bg: c.infoBg, fg: c.info }),
  success: (c) => ({ bg: c.successBg, fg: c.success }),
};

export default function Banner({ kind = 'info', icon = 'alertTriangle', text }) {
  const { colors } = useTheme();
  const c = (KIND_MAP[kind] || KIND_MAP.info)(colors);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        columnGap: 8,
        backgroundColor: c.bg,
        borderRadius: radius.sm,
        paddingVertical: 9,
        paddingHorizontal: 11,
      }}
    >
      <Icon name={icon} size={15} color={c.fg} style={{ marginTop: 1 }} />
      <Text style={{ color: c.fg, fontFamily: fontFamily.bodySemibold, fontSize: 11.5, flex: 1, lineHeight: 16 }}>
        {text}
      </Text>
    </View>
  );
}

export function BannerStack({ banners }) {
  if (!banners.length) return null;
  return (
    <View style={{ rowGap: 6, marginBottom: 2 }}>
      {banners.map((b, i) => (
        <Banner key={i} {...b} />
      ))}
    </View>
  );
}
