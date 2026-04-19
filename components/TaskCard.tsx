/**
 * TaskCard — Swipeable task card component.
 * Displays task info with checkbox, priority indicator, and swipe actions.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, Priority } from '../types/task';
import { formatTime, getRelativeDate } from '../utils/dateHelpers';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';
import { RECURRENCE_CONFIG } from '../constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.4;

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
}

export default function TaskCard({ task, onPress }: TaskCardProps) {
  const { toggleComplete, deleteTask, darkMode } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;
  const translateX = useRef(new Animated.Value(0)).current;

  // PanResponder for swipe-to-delete
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping to the left
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Complete the swipe and delete
          handleSwipeDelete();
        } else {
          // Snap back to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 10,
          }).start();
        }
      },
    })
  ).current;

  // Priority color mapping
  const priorityColor = {
    [Priority.LOW]: colors.priorityLow,
    [Priority.MEDIUM]: colors.priorityMedium,
    [Priority.HIGH]: colors.priorityHigh,
  }[task.priority];

  // Handle checkbox press with animation
  const handleToggle = () => {
    toggleComplete(task.id);
  };

  // Swipe to delete
  const handleSwipeDelete = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      deleteTask(task.id);
    });
  };

  // Time display string
  const timeDisplay = task.startTime
    ? task.endTime
      ? `${formatTime(task.startTime)} - ${formatTime(task.endTime)}`
      : formatTime(task.startTime)
    : null;

  return (
    <View style={styles.container}>
      {/* Delete background (revealed on swipe) */}
      <View style={[styles.deleteBackground, { backgroundColor: colors.error }]}>
        <Ionicons name="trash-outline" size={24} color="#FFF" />
        <Text style={styles.deleteText}>Delete</Text>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderLeftColor: priorityColor,
            borderLeftWidth: 4,
            transform: [{ translateX }],
            shadowColor: colors.shadow,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => onPress(task)}
          activeOpacity={0.7}
          style={styles.cardContent}
        >
          {/* Checkbox */}
          <TouchableOpacity
            onPress={handleToggle}
            style={[
              styles.checkbox,
              {
                borderColor: task.completed ? colors.success : colors.border,
                backgroundColor: task.completed ? colors.success : 'transparent',
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {task.completed && (
              <Ionicons name="checkmark" size={14} color="#FFF" />
            )}
          </TouchableOpacity>

          {/* Task info */}
          <View style={styles.info}>
            <Text
              style={[
                styles.title,
                {
                  color: task.completed ? colors.textMuted : colors.textPrimary,
                  textDecorationLine: task.completed ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>

            {task.description ? (
              <Text
                style={[styles.description, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {task.description}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              {/* Due date */}
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {getRelativeDate(task.dueDate)}
                </Text>
              </View>

              {/* Time */}
              {timeDisplay && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {timeDisplay}
                  </Text>
                </View>
              )}

              {/* Recurrence badge */}
              {task.recurrence !== 'none' && (
                <View style={styles.metaItem}>
                  <Ionicons name="repeat-outline" size={12} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.primary }]}>
                    {RECURRENCE_CONFIG[task.recurrence].label}
                  </Text>
                </View>
              )}

              {/* Reminder icon */}
              {task.reminder.enabled && (
                <Ionicons
                  name="notifications-outline"
                  size={12}
                  color={colors.warning}
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
          </View>

          {/* Priority dot */}
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
        </TouchableOpacity>

        {/* Quick delete button */}
        <TouchableOpacity
          onPress={handleSwipeDelete}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 4,
  },
  deleteText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 4,
  },
});
