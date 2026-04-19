/**
 * ProgressRing — Circular SVG progress indicator for daily completion stats.
 * Shows a ring that fills based on completion percentage with a label inside.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CompletionStats } from '../types/task';
import { useTaskStore } from '../store/useTaskStore';
import { lightColors, darkColors } from '../theme/colors';

interface ProgressRingProps {
  stats: CompletionStats;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({
  stats,
  size = 90,
  strokeWidth = 8,
}: ProgressRingProps) {
  const { darkMode } = useTaskStore();
  const colors = darkMode ? darkColors : lightColors;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (stats.percentage / 100) * circumference;

  // Dynamic color based on percentage
  const progressColor =
    stats.percentage >= 75
      ? colors.success
      : stats.percentage >= 40
      ? colors.warning
      : colors.primary;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background ring */}
        <Circle
          stroke={colors.border}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {/* Progress ring */}
        <Circle
          stroke={progressColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center label */}
      <View style={styles.labelContainer}>
        <Text style={[styles.percentage, { color: colors.textPrimary }]}>
          {stats.percentage}%
        </Text>
        <Text style={[styles.sublabel, { color: colors.textMuted }]}>
          {stats.completed}/{stats.total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  sublabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: -2,
  },
});
