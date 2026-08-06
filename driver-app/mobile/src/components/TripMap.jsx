import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { buildMapHtml } from './mapHtml';

// Native (iOS/Android): render the Leaflet map inside a WebView.
export default function TripMap({ plannedRoute = [], path = [], position = null, height = 200 }) {
  const { colors, isDark } = useTheme();
  const html = buildMapHtml({ plannedRoute, path, position, dark: isDark });
  return (
    <View style={{ height, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ flex: 1, backgroundColor: colors.accentDim }}
        scrollEnabled={false}
        javaScriptEnabled
      />
    </View>
  );
}
