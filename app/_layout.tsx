/**
 * Root Layout — Tab navigation with custom styling.
 * Sets up the Home, Calendar, and Settings tabs with themed tab bar.
 */

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';
import { requestNotificationPermissions } from '../services/notifications';

export default function RootLayout() {
  const { darkMode, processRecurring, setHasLoaded } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  useEffect(() => {
    // Request notification permissions on first launch
    requestNotificationPermissions();

    // Mark store as loaded
    setHasLoaded();

    // Process recurring tasks when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        processRecurring();
      }
    });

    // Process on initial mount too
    processRecurring();

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 28,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkbox-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
        {/* Hide add-task and task detail from tab bar */}
        <Tabs.Screen
          name="add-task"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="task/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
