/**
 * EmptyState — Illustrated empty state with icon and call-to-action text.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: string;
}

export default function EmptyState({
  title,
  subtitle,
  icon = 'clipboard-outline',
}: EmptyStateProps) {
  const { darkMode } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon as any} size={48} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
