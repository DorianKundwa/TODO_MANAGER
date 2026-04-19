/**
 * TaskList — Scrollable list of TaskCard components.
 * Shows filtered/searched tasks with section headers and empty states.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import TaskCard from './TaskCard';
import EmptyState from './EmptyState';
import { Task } from '../types/task';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';

interface TaskListProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  /** Optional header component */
  ListHeaderComponent?: React.ReactElement;
}

export default function TaskList({ tasks, onTaskPress, ListHeaderComponent }: TaskListProps) {
  const { darkMode, filter } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  // Labels for empty state based on current filter
  const emptyMessages: Record<string, { title: string; subtitle: string }> = {
    all: {
      title: 'No tasks yet',
      subtitle: 'Tap the + button to create your first task',
    },
    today: {
      title: 'Nothing due today',
      subtitle: 'You\'re all caught up! 🎉',
    },
    upcoming: {
      title: 'No upcoming tasks',
      subtitle: 'Plan ahead by adding future tasks',
    },
    completed: {
      title: 'No completed tasks',
      subtitle: 'Complete some tasks to see them here',
    },
  };

  const emptyMsg = emptyMessages[filter] || emptyMessages.all;

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskCard task={item} onPress={onTaskPress} />
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <EmptyState title={emptyMsg.title} subtitle={emptyMsg.subtitle} />
      }
      contentContainerStyle={[
        styles.list,
        tasks.length === 0 && styles.emptyList,
      ]}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 100, // Space for FAB
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
