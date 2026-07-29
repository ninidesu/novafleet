import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';

export default function SegmentedControl({ options, value, onChange }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.lineSoft, borderRadius: radius.sm, padding: 3, columnGap: 2 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: active ? colors.panel : 'transparent',
            }}
          >
            <Text style={{ color: active ? colors.text : colors.muted, fontFamily: fontFamily.bodyBold, fontSize: 11.5 }}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
