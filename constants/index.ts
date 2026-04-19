/**
 * App-wide constants and configuration values.
 */

// AsyncStorage keys
export const STORAGE_KEYS = {
  TASKS: '@taskflow/tasks',
  SETTINGS: '@taskflow/settings',
  THEME: '@taskflow/theme',
} as const;

// Reminder time options (in minutes before due date)
export const REMINDER_OPTIONS = [
  { label: 'At time of task', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
] as const;

// Priority configuration
export const PRIORITY_CONFIG = {
  low: { label: 'Low', emoji: '🟢' },
  medium: { label: 'Medium', emoji: '🟡' },
  high: { label: 'High', emoji: '🔴' },
} as const;

// Recurrence labels
export const RECURRENCE_CONFIG = {
  none: { label: 'No repeat', emoji: '' },
  daily: { label: 'Daily', emoji: '📅' },
  weekly: { label: 'Weekly', emoji: '📆' },
  monthly: { label: 'Monthly', emoji: '🗓️' },
} as const;

// Animation durations (ms)
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;
