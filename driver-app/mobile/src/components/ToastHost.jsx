import React from 'react';
import { View, Text } from 'react-native';
import { useAppState } from '../state/AppStateContext';
import { fontFamily, radius } from '../theme/tokens';
import Icon from '../theme/icons';

const BG = { success: '#0f3b26', danger: '#4a1414', info: '#0B1F3A' };

export default function ToastHost() {
  const { toast } = useAppState();
  if (!toast) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 90,
        zIndex: 50,
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 9,
        backgroundColor: BG[toast.kind] || BG.info,
        borderRadius: radius.md,
        paddingVertical: 11,
        paddingHorizontal: 13,
      }}
    >
      <Icon name={toast.icon} size={16} color="#fff" />
      <Text style={{ color: '#fff', fontFamily: fontFamily.bodySemibold, fontSize: 12, flex: 1 }}>{toast.text}</Text>
    </View>
  );
}
