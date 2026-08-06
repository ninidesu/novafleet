import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { buildMapHtml } from './mapHtml';

// Web (Expo web): react-native-webview is unsupported, so render the Leaflet
// map in a real <iframe> (react-native-web is React DOM under the hood).
export default function TripMap({ plannedRoute = [], path = [], position = null, height = 200 }) {
  const { colors, isDark } = useTheme();
  const html = buildMapHtml({ plannedRoute, path, position, dark: isDark });
  return (
    <View style={{ height, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
      <iframe title="Trip map" srcDoc={html} style={{ border: 0, width: '100%', height: '100%' }} />
    </View>
  );
}
