/**
 * Task Detail Screen — Full detail view for a single task.
 * Allows viewing, editing, completing, and deleting a task.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PriorityBadge from '../../components/PriorityBadge';
import { useTaskStore } from '../../store/useTaskStore';
import { lightColors, darkColors } from '../../theme/colors';
import { formatDate, formatTime, getRelativeDate, getDayOfWeek } from '../../utils/dateHelpers';
import { RECURRENCE_CONFIG } from '../../constants';
import { getNextOccurrenceLabel } from '../../services/recurringTasks';

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getTaskById, toggleComplete, deleteTask, darkMode } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  const task = getTaskById(id);

  // Handle missing task
  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
            Task not found
          </Text>
        </View>
      </View>
    );
  }

  // Handle delete with confirmation
  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTask(task.id);
            router.back();
          },
        },
      ]
    );
  };

  // Navigate to edit
  const handleEdit = () => {
    router.push({ pathname: '/add-task', params: { editId: task.id } });
  };

  const recurrenceLabel = getNextOccurrenceLabel(task);

  // Detail row component
  const DetailRow = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: string;
    label: string;
    value: string;
    color?: string;
  }) => (
    <View style={[styles.detailRow, { borderBottomColor: colors.divider }]}>
      <Ionicons name={icon as any} size={20} color={color || colors.textMuted} />
      <View style={styles.detailContent}>
        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title and completion */}
        <View style={styles.titleSection}>
          <TouchableOpacity
            onPress={() => toggleComplete(task.id)}
            style={[
              styles.bigCheckbox,
              {
                borderColor: task.completed ? colors.success : colors.border,
                backgroundColor: task.completed ? colors.success : 'transparent',
              },
            ]}
          >
            {task.completed && (
              <Ionicons name="checkmark" size={24} color="#FFF" />
            )}
          </TouchableOpacity>
          <View style={styles.titleContent}>
            <Text
              style={[
                styles.title,
                {
                  color: task.completed ? colors.textMuted : colors.textPrimary,
                  textDecorationLine: task.completed ? 'line-through' : 'none',
                },
              ]}
            >
              {task.title}
            </Text>
            <View style={styles.badgeRow}>
              <PriorityBadge priority={task.priority} size="medium" />
              {task.completed && (
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.success }]}>
                    Completed
                  </Text>
                </View>
              )}
              {task.syncStatus && task.syncStatus !== 'synced' && (
                <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusText, { color: colors.primary }]}>
                    Syncing...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        {task.description && (
          <View style={[styles.descriptionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {task.description}
            </Text>
          </View>
        )}

        {/* Details card */}
        <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
          <DetailRow
            icon="calendar-outline"
            label="Due Date"
            value={`${getDayOfWeek(task.dueDate)}, ${formatDate(task.dueDate)} (${getRelativeDate(task.dueDate)})`}
            color={colors.primary}
          />

          {task.startTime && (
            <DetailRow
              icon="time-outline"
              label="Time"
              value={
                task.endTime
                  ? `${formatTime(task.startTime)} – ${formatTime(task.endTime)}`
                  : formatTime(task.startTime)
              }
              color={colors.info}
            />
          )}

          {recurrenceLabel && (
            <DetailRow
              icon="repeat-outline"
              label="Recurrence"
              value={recurrenceLabel}
              color={colors.primary}
            />
          )}

          <DetailRow
            icon="notifications-outline"
            label="Reminder"
            value={
              task.reminder.enabled
                ? `${task.reminder.minutesBefore} min before`
                : 'Off'
            }
            color={colors.warning}
          />

          <DetailRow
            icon="time-outline"
            label="Created"
            value={new Date(task.createdAt).toLocaleDateString()}
          />

          {task.completedAt && (
            <DetailRow
              icon="checkmark-circle-outline"
              label="Completed"
              value={new Date(task.completedAt).toLocaleDateString()}
              color={colors.success}
            />
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => toggleComplete(task.id)}
            style={[
              styles.actionButton,
              {
                backgroundColor: task.completed ? colors.warning + '15' : colors.success + '15',
                borderColor: task.completed ? colors.warning : colors.success,
              },
            ]}
          >
            <Ionicons
              name={task.completed ? 'refresh-outline' : 'checkmark-circle-outline'}
              size={20}
              color={task.completed ? colors.warning : colors.success}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: task.completed ? colors.warning : colors.success },
              ]}
            >
              {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.error + '15',
                borderColor: colors.error,
              },
            ]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>
              Delete Task
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 14,
  },
  bigCheckbox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailsCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
