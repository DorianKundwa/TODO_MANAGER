/**
 * Calendar Screen — Monthly calendar view with task dots.
 * Selecting a date shows the tasks due on that day.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';
import { getToday, formatDate, getDayOfWeek } from '../utils/dateHelpers';
import { Task } from '../types/task';

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { darkMode, getMarkedDates, getTasksByDate, tasks } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const markedDates = useMemo(() => getMarkedDates(), [tasks]);
  const tasksForDate = useMemo(() => getTasksByDate(selectedDate), [tasks, selectedDate]);

  // Navigate to task detail
  const handleTaskPress = (task: Task) => {
    router.push(`/task/${task.id}`);
  };

  // Merge selected date highlighting with task dots
  const mergedMarked = {
    ...markedDates,
    [selectedDate]: {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: '#FFF',
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Calendar
        </Text>
      </View>

      {/* Calendar */}
      <Calendar
        current={selectedDate}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={mergedMarked}
        markingType="multi-dot"
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textMuted,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: '#FFF',
          todayTextColor: colors.primary,
          dayTextColor: colors.textPrimary,
          textDisabledColor: colors.textMuted + '60',
          monthTextColor: colors.textPrimary,
          arrowColor: colors.primary,
          textMonthFontWeight: '700',
          textMonthFontSize: 18,
          textDayFontSize: 14,
          textDayFontWeight: '500',
          textDayHeaderFontSize: 12,
          textDayHeaderFontWeight: '600',
        }}
        style={styles.calendar}
      />

      {/* Selected date label */}
      <View style={styles.dateLabel}>
        <Text style={[styles.dateLabelText, { color: colors.textPrimary }]}>
          {getDayOfWeek(selectedDate)}, {formatDate(selectedDate)}
        </Text>
        <Text style={[styles.taskCount, { color: colors.textMuted }]}>
          {tasksForDate.length} task{tasksForDate.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Tasks for selected date */}
      <FlatList
        data={tasksForDate}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard task={item} onPress={handleTaskPress} />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No tasks"
            subtitle={`Nothing scheduled for ${formatDate(selectedDate)}`}
            icon="calendar-clear-outline"
          />
        }
        contentContainerStyle={[
          styles.taskList,
          tasksForDate.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  calendar: {
    borderBottomWidth: 0,
    paddingBottom: 8,
  },
  dateLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dateLabelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  taskList: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
});
