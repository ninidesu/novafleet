import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function ScreenContainer({ children, scroll = true, style }) {
  const { colors } = useTheme();
  const Wrapper = scroll ? ScrollView : View;
  const wrapperProps = scroll
    ? { contentContainerStyle: [styles.content, style], keyboardShouldPersistTaps: 'handled' }
    : { style: [styles.content, style] };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Wrapper {...wrapperProps}>{children}</Wrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, rowGap: 14, paddingBottom: 28 },
});
