import React from 'react';
import { Pressable } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/tokens';
import Icon from '../theme/icons';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SetupScreen from '../screens/SetupScreen';
import MainTabs from './MainTabs';
import TripDetailsScreen from '../screens/TripDetailsScreen';
import PretripChecklistScreen from '../screens/PretripChecklistScreen';
import TrackingMethodScreen from '../screens/TrackingMethodScreen';
import IncidentScreen from '../screens/IncidentScreen';
import SosScreen from '../screens/SosScreen';
import CompleteTripScreen from '../screens/CompleteTripScreen';
import TripSummaryScreen from '../screens/TripSummaryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: { ...(isDark ? DarkTheme.colors : DefaultTheme.colors), background: colors.bg, card: colors.panel, text: colors.text, border: colors.line, primary: colors.accent },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: colors.panel },
          headerTitleStyle: { color: colors.text, fontFamily: fontFamily.displaySemibold, fontSize: 15 },
          headerShadowVisible: false,
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.panel,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="back" size={16} color={colors.text} />
              </Pressable>
            ) : null,
        })}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Setup" component={SetupScreen} options={{ title: 'Setup' }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="TripDetails" component={TripDetailsScreen} options={{ title: 'Trip Details' }} />
        <Stack.Screen name="Pretrip" component={PretripChecklistScreen} options={{ title: 'Checklist' }} />
        <Stack.Screen name="Tracking" component={TrackingMethodScreen} options={{ title: 'Tracking Method' }} />
        <Stack.Screen name="Incident" component={IncidentScreen} options={{ title: 'Report Incident' }} />
        <Stack.Screen name="Sos" component={SosScreen} options={{ title: 'SOS' }} />
        <Stack.Screen name="CompleteTrip" component={CompleteTripScreen} options={{ title: 'End trip' }} />
        <Stack.Screen name="TripSummary" component={TripSummaryScreen} options={{ title: 'Trip Summary', headerBackVisible: false }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
