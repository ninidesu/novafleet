import React from 'react';
import { ScrollView, Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';

export default function TabPills({ options, value, onChange }) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ columnGap: 6 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 7,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: active ? colors.accent : colors.line,
              backgroundColor: active ? colors.accentDim : colors.panel,
            }}
          >
            <Text style={{ color: active ? colors.accent : colors.muted, fontFamily: fontFamily.bodyBold, fontSize: 11.5 }}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
