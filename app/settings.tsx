/**
 * Settings Screen — Theme toggle, notification preferences, and data management.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';
import { cancelAllReminders } from '../services/notifications';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { darkMode, toggleDarkMode, clearCompleted, tasks } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  // Clear completed tasks with confirmation
  const handleClearCompleted = () => {
    if (completedCount === 0) {
      Alert.alert('No completed tasks', 'There are no completed tasks to clear.');
      return;
    }
    Alert.alert(
      'Clear Completed Tasks',
      `This will permanently delete ${completedCount} completed task${completedCount !== 1 ? 's' : ''}. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: clearCompleted,
        },
      ]
    );
  };

  // Cancel all notifications
  const handleCancelNotifications = () => {
    Alert.alert(
      'Cancel All Reminders',
      'This will cancel all scheduled task reminders.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await cancelAllReminders();
            Alert.alert('Done', 'All reminders have been cancelled.');
          },
        },
      ]
    );
  };

  // Settings row component
  const SettingsRow = ({
    icon,
    label,
    value,
    onPress,
    color,
    showChevron = true,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    color?: string;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, { borderBottomColor: colors.divider }]}
      activeOpacity={0.6}
    >
      <View style={[styles.iconCircle, { backgroundColor: (color || colors.primary) + '18' }]}>
        <Ionicons name={icon as any} size={20} color={color || colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {value && (
          <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>
        )}
      </View>
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Settings
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          APPEARANCE
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={toggleDarkMode}
            style={[styles.row, { borderBottomColor: colors.divider }]}
            activeOpacity={0.6}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons
                name={darkMode ? 'moon' : 'sunny'}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                Dark Mode
              </Text>
              <Text style={[styles.rowValue, { color: colors.textMuted }]}>
                {darkMode ? 'On' : 'Off'}
              </Text>
            </View>
            {/* Custom toggle */}
            <View
              style={[
                styles.toggle,
                { backgroundColor: darkMode ? colors.primary : colors.border },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: darkMode ? 18 : 2 }] },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          NOTIFICATIONS
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="notifications-off-outline"
            label="Cancel All Reminders"
            onPress={handleCancelNotifications}
            color={colors.warning}
          />
        </View>

        {/* Data */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          DATA
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="stats-chart-outline"
            label="Total Tasks"
            value={String(totalCount)}
            showChevron={false}
          />
          <SettingsRow
            icon="checkmark-done-outline"
            label="Completed Tasks"
            value={String(completedCount)}
            showChevron={false}
          />
          <SettingsRow
            icon="trash-outline"
            label="Clear Completed Tasks"
            value={`${completedCount} task${completedCount !== 1 ? 's' : ''}`}
            onPress={handleClearCompleted}
            color={colors.error}
          />
        </View>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          ABOUT
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="information-circle-outline"
            label="Version"
            value="1.0.0"
            showChevron={false}
          />
          <SettingsRow
            icon="code-slash-outline"
            label="Built with"
            value="React Native & Expo"
            showChevron={false}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 12,
    marginTop: 1,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
