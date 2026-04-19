/**
 * PriorityBadge — Color-coded chip showing task priority level.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Priority } from '../types/task';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'small' | 'medium';
}

export default function PriorityBadge({ priority, size = 'small' }: PriorityBadgeProps) {
  const { darkMode } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  const priorityConfig = {
    [Priority.LOW]: { label: 'Low', color: colors.priorityLow },
    [Priority.MEDIUM]: { label: 'Medium', color: colors.priorityMedium },
    [Priority.HIGH]: { label: 'High', color: colors.priorityHigh },
  };

  const config = priorityConfig[priority];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.color + '20', // 12% opacity
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 3 : 5,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: isSmall ? 11 : 13,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontWeight: '600',
  },
});
