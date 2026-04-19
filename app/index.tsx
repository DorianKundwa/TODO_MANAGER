/**
 * Home Screen — Main dashboard with greeting, progress ring, search/filters, and task list.
 * This is the primary screen users interact with.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TaskList from '../components/TaskList';
import FloatingActionButton from '../components/FloatingActionButton';
import ProgressRing from '../components/ProgressRing';
import SearchBar from '../components/SearchBar';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';
import { getGreeting, getToday, getDayOfWeek, formatDate } from '../utils/dateHelpers';
import { Task } from '../types/task';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { darkMode, getFilteredTasks, getTodayStats } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  const filteredTasks = getFilteredTasks();
  const todayStats = getTodayStats();
  const today = getToday();

  // Navigate to add-task screen
  const handleAddTask = () => {
    router.push('/add-task');
  };

  // Navigate to task detail screen
  const handleTaskPress = (task: Task) => {
    router.push(`/task/${task.id}`);
  };

  // Dashboard header with greeting and progress ring
  const ListHeader = (
    <View>
      {/* Greeting section */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()} 👋
          </Text>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {getDayOfWeek(today)}, {formatDate(today)}
          </Text>
        </View>

        {/* Progress ring */}
        <ProgressRing stats={todayStats} size={80} strokeWidth={7} />
      </View>

      {/* Today's summary card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.surfaceElevated }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>
            {todayStats.total}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Today
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.success }]}>
            {todayStats.completed}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Done
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.priorityHigh }]}>
            {todayStats.total - todayStats.completed}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Pending
          </Text>
        </View>
      </View>

      {/* Search and filter bar */}
      <SearchBar />

      {/* Section title */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Tasks
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TaskList
        tasks={filteredTasks}
        onTaskPress={handleTaskPress}
        ListHeaderComponent={ListHeader}
      />
      <FloatingActionButton onPress={handleAddTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
