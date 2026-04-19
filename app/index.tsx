/**
 * Home Screen — Main dashboard with greeting, progress ring, search/filters, and task list.
 * This is the primary screen users interact with.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TaskList from '../components/TaskList';
import FloatingActionButton from '../components/FloatingActionButton';
import ProgressRing from '../components/ProgressRing';
import SearchBar from '../components/SearchBar';
import { ActivityIndicator, Animated } from 'react-native';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';
import { getGreeting, getToday, getDayOfWeek, formatDate } from '../utils/dateHelpers';
import { Task } from '../types/task';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { darkMode, getFilteredTasks, getTodayStats, tasks, filter, searchQuery, syncing, lastError } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  const filteredTasks = useMemo(() => getFilteredTasks(), [tasks, filter, searchQuery]);
  const todayStats = useMemo(() => getTodayStats(), [tasks]);
  const today = getToday();

  // Error message animation
  const errorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lastError) {
      Animated.sequence([
        Animated.timing(errorOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(errorOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [lastError]);

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
          <View style={styles.greetingRow}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()} 👋
            </Text>
            {syncing && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 10 }} />
            )}
          </View>
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
      
      {/* Sync Status Overlay */}
      {syncing && (
        <View style={[styles.syncOverlay, { backgroundColor: colors.surface + 'CC' }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.syncText, { color: colors.textPrimary }]}>Updating...</Text>
        </View>
      )}

      {/* Error Toast */}
      {lastError && (
        <Animated.View style={[styles.errorToast, { backgroundColor: colors.error, opacity: errorOpacity }]}>
          <Text style={styles.errorText}>{lastError}</Text>
        </Animated.View>
      )}

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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  syncOverlay: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  syncText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorToast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  errorText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
