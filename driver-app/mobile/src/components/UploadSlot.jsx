import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import Icon from '../theme/icons';

// Simulates capturing a photo — toggles a local "added" flag.
// Real camera integration (expo-camera / expo-image-picker) is a backend/native
// concern intentionally out of scope for this front-end pass.
export default function UploadSlot({ added, onPress, addedLabel = 'Photo added', emptyLabel = 'Add photo' }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 72,
        borderRadius: radius.md,
        borderWidth: added ? 0 : 1.5,
        borderStyle: added ? 'solid' : 'dashed',
        borderColor: added ? colors.success : colors.line,
        backgroundColor: added ? colors.successBg : colors.lineSoft,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        columnGap: 8,
      }}
    >
      <Icon name={added ? 'checkCircle' : 'camera'} size={17} color={added ? colors.success : colors.muted} />
      <Text style={{ color: added ? colors.success : colors.muted, fontFamily: fontFamily.bodySemibold, fontSize: 11.5 }}>
        {added ? addedLabel : emptyLabel}
      </Text>
    </Pressable>
  );
}
