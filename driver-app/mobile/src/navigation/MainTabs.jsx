import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../state/AppStateContext';
import Icon from '../theme/icons';
import HomeScreen from '../screens/HomeScreen';
import AssignmentsScreen from '../screens/AssignmentsScreen';
import FuelScreen from '../screens/FuelScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICON = { Home: 'home', Assignments: 'assignments', Fuel: 'fuel', History: 'history', Profile: 'profile' };

export default function MainTabs() {
  const { colors } = useTheme();
  const { tripActive } = useAppState();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.line, height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 9.5, fontWeight: '700' },
        tabBarLabel: route.name === 'Home' && tripActive ? 'Trip' : route.name,
        tabBarIcon: ({ color, size }) => (
          <View>
            <Icon name={TAB_ICON[route.name]} size={size ? size - 2 : 18} color={color} />
            {route.name === 'Home' && tripActive ? (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  backgroundColor: colors.accent,
                }}
              />
            ) : null}
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Assignments" component={AssignmentsScreen} />
      <Tab.Screen name="Fuel" component={FuelScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
