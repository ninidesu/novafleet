import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/tokens';
import Icon from '../theme/icons';

export default function ChecklistItem({ label, checked, last }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        columnGap: 9,
        paddingVertical: 9,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.lineSoft,
      }}
    >
      <View
        style={{
          width: 19,
          height: 19,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? colors.success : colors.line,
          backgroundColor: checked ? colors.success : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {checked ? <Icon name="checkCircle" size={12} color="#fff" /> : null}
      </View>
      <Text style={{ color: colors.text, fontFamily: fontFamily.bodySemibold, fontSize: 12, flex: 1, lineHeight: 17 }}>
        {label}
      </Text>
    </View>
  );
}
