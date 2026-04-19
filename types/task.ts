/**
 * Core type definitions for the TaskFlow app.
 * All task-related interfaces and enums live here.
 */

// Priority levels for tasks
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// Recurrence patterns for recurring tasks
export enum Recurrence {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// Filter options for the task list view
export type FilterType = 'all' | 'today' | 'upcoming' | 'completed';

// Reminder configuration for notifications
export interface ReminderConfig {
  enabled: boolean;
  /** Minutes before due date to trigger the reminder */
  minutesBefore: number;
  /** Whether the reminder repeats (for recurring tasks) */
  repeating: boolean;
}

// Main Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  /** ISO date string (YYYY-MM-DD) */
  dueDate: string;
  /** Optional start time (HH:mm) */
  startTime: string | null;
  /** Optional end time (HH:mm) */
  endTime: string | null;
  priority: Priority;
  completed: boolean;
  /** ISO timestamp when the task was marked complete */
  completedAt: string | null;
  recurrence: Recurrence;
  reminder: ReminderConfig;
  /** ISO timestamp of when the task was created */
  createdAt: string;
  /** Notification identifier for cancellation */
  notificationId: string | null;
  /** The ID of the original task if this is a recurring instance */
  parentTaskId: string | null;
  /** Synchronization status: 'synced', 'pending_create', 'pending_update', 'pending_delete' */
  syncStatus?: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
}

// Completion stats for the progress ring
export interface CompletionStats {
  total: number;
  completed: number;
  percentage: number;
}
